import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Upload, FileText, File } from "lucide-react";

import type { Deck, GenerateCardsRequest } from "@shared/schema";

// Form schema
const createFormSchema = z.object({
  deckId: z.string().min(1, "Please select a deck"),
  newDeckName: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  count: z.number().int().min(5).max(30),
  includeImages: z.boolean().default(false),
  increaseDifficulty: z.boolean().default(false),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

export default function CreatePage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"text" | "file">("text");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch decks
  const { data: decks, isLoading: isLoadingDecks } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  // Create new deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/decks", { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
  });

  // Generate cards mutation
  const generateCardsMutation = useMutation({
    mutationFn: async (data: GenerateCardsRequest) => {
      const response = await apiRequest("POST", "/api/generate-cards", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSuccessMessage(`Successfully generated ${data.count} flashcards!`);
      
      // Show success message and redirect after delay
      setTimeout(() => {
        navigate("/");
      }, 3000);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error generating flashcards",
        description: error.message,
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload document");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSuccessMessage(`Successfully generated ${data.count} flashcards from ${data.fileName}!`);
      setUploadedFile(null);
      
      // Show success message and redirect after delay
      setTimeout(() => {
        navigate("/");
      }, 3000);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error processing document",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Initialize form with default values
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      deckId: "",
      newDeckName: "",
      content: "",
      count: 10,
      includeImages: false,
      increaseDifficulty: false,
    },
  });

  const onSubmit = async (values: CreateFormValues) => {
    try {
      let deckId = parseInt(values.deckId);

      // If creating a new deck, create it first
      if (values.deckId === "new" && values.newDeckName) {
        const newDeck = await createDeckMutation.mutateAsync(values.newDeckName);
        deckId = newDeck.id;
      }

      // Generate cards
      await generateCardsMutation.mutateAsync({
        deckId,
        content: values.content,
        count: values.count,
        includeImages: values.includeImages,
        increaseDifficulty: values.increaseDifficulty,
      });

    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (selectedDeckId: string) => {
    if (!uploadedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload",
      });
      return;
    }

    try {
      let deckId = parseInt(selectedDeckId);

      // If creating a new deck, create it first
      if (selectedDeckId === "new") {
        const newDeckName = form.getValues("newDeckName") || "";
        if (newDeckName.trim()) {
          const newDeck = await createDeckMutation.mutateAsync(newDeckName);
          deckId = newDeck.id;
        } else {
          toast({
            variant: "destructive",
            title: "Deck name required",
            description: "Please enter a name for your new deck",
          });
          return;
        }
      }

      const formData = new FormData();
      formData.append('document', uploadedFile);
      formData.append('deckId', deckId.toString());
      formData.append('count', form.getValues("count").toString());
      formData.append('includeImages', form.getValues("includeImages").toString());
      formData.append('increaseDifficulty', form.getValues("increaseDifficulty").toString());

      setIsUploading(true);
      await uploadDocumentMutation.mutateAsync(formData);
    } catch (error) {
      console.error("File upload error:", error);
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadedFile(file);
  };

  // Handle deck selection changes
  const handleDeckChange = (value: string) => {
    form.setValue("deckId", value);
    setShowNewDeckForm(value === "new");
  };

  const isSubmitting = generateCardsMutation.isPending || createDeckMutation.isPending || isUploading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Flashcards</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add content and FlashForge will generate flashcards using AI.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Flashcards</CardTitle>
          <CardDescription>
            Choose how you want to provide content for flashcard generation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs 
            defaultValue="text" 
            className="mb-6"
            onValueChange={(value) => setInputMethod(value as "text" | "file")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text Input
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="deckId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose a Deck</FormLabel>
                        <Select onValueChange={handleDeckChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a deck" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {decks?.map((deck) => (
                              <SelectItem key={deck.id} value={deck.id.toString()}>
                                {deck.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">+ Create New Deck</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showNewDeckForm && (
                    <FormField
                      control={form.control}
                      name="newDeckName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Deck Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. CSS Flexbox" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content to Generate Cards From</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste text containing content you want to convert into flashcards..."
                            className="min-h-[200px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add content that you want to learn. AI will analyze this and create relevant flashcards.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Cards to Generate</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl>
                            <Slider
                              min={5}
                              max={30}
                              step={5}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <span className="text-sm text-gray-700 dark:text-gray-300 w-8">
                            {field.value}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Advanced Options</h3>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md space-y-4">
                      <FormField
                        control={form.control}
                        name="includeImages"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <FormLabel>Generate image hints when possible</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="increaseDifficulty"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <FormLabel>Increase difficulty level</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Generate Flashcards
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="file">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">Choose a Deck</label>
                  <Select onValueChange={handleDeckChange} defaultValue={form.getValues("deckId")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a deck" />
                    </SelectTrigger>
                    <SelectContent>
                      {decks?.map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Create New Deck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showNewDeckForm && (
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">New Deck Name</label>
                    <Input 
                      placeholder="e.g. CSS Flexbox" 
                      value={form.getValues("newDeckName")}
                      onChange={(e) => form.setValue("newDeckName", e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">Upload Document</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {uploadedFile ? (
                        <div className="text-center space-y-2">
                          <File className="h-10 w-10 text-primary mx-auto" />
                          <p className="text-sm font-medium">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setUploadedFile(null)}
                          >
                            Change file
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Supports: .txt, .docx, .pdf, .pptx (max 10MB)
                          </p>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept=".txt,.docx,.pdf,.pptx" 
                        className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${uploadedFile ? 'hidden' : ''}`}
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">Number of Cards to Generate</label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      min={5}
                      max={30}
                      step={5}
                      value={[form.getValues("count")]}
                      onValueChange={(value) => form.setValue("count", value[0])}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-8">
                      {form.getValues("count")}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Advanced Options</h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <FormLabel>Generate image hints when possible</FormLabel>
                      <Checkbox
                        checked={form.getValues("includeImages")}
                        onCheckedChange={(checked) => 
                          form.setValue("includeImages", checked === true)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <FormLabel>Increase difficulty level</FormLabel>
                      <Checkbox
                        checked={form.getValues("increaseDifficulty")}
                        onCheckedChange={(checked) => 
                          form.setValue("increaseDifficulty", checked === true)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button 
                    type="button" 
                    disabled={isSubmitting || !uploadedFile || !form.getValues("deckId")}
                    onClick={() => handleFileUpload(form.getValues("deckId"))}
                  >
                    {isUploading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Upload and Generate Flashcards
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {successMessage && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                {successMessage} They've been added to your deck.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
