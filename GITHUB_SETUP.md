# GitHub Setup and Local Development Guide

This guide will help you push your FlashForge project to GitHub and set it up for local development.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com/) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository (e.g., "flashforge")
4. Add a description (optional)
5. Choose public or private visibility
6. Do not initialize the repository with README, .gitignore, or license (we'll push our existing files)
7. Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands to push your existing project. Follow these steps:

1. Open a terminal and navigate to your project directory
2. Initialize a Git repository (if you haven't already):
   ```bash
   git init
   ```
3. Add all files to staging:
   ```bash
   git add .
   ```
4. Commit the files:
   ```bash
   git commit -m "Initial commit"
   ```
5. Add the GitHub repository as remote:
   ```bash
   git remote add origin https://github.com/yourusername/flashforge.git
   ```
   (Replace `yourusername` with your GitHub username and `flashforge` with your repository name)
6. Push your code to GitHub:
   ```bash
   git push -u origin main
   ```
   (If your default branch is `master` instead of `main`, use `git push -u origin master`)

## Step 3: Setting Up for Local Development

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/yourusername/flashforge.git
   cd flashforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MongoDB:
   - Install MongoDB locally if you don't have it already
   - Or create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a new database named `flashforge`

4. Create a `.env` file in the root directory with your MongoDB connection string and OpenAI API key:
   ```
   MONGODB_URI=mongodb://localhost:27017/flashforge
   OPENAI_API_KEY=your_openai_api_key
   ```
   - For local MongoDB: use `mongodb://localhost:27017/flashforge`
   - For MongoDB Atlas: use the connection string provided by MongoDB Atlas, typically in this format: `mongodb+srv://<username>:<password>@<cluster-url>/flashforge?retryWrites=true&w=majority`
   - Replace `your_openai_api_key` with your actual OpenAI API key

6. Start the development server:
   ```bash
   npm run dev
   ```

7. The application should now be running on http://localhost:5000

## Step 4: Making Changes and Pushing Updates

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes

3. Add and commit your changes:
   ```bash
   git add .
   git commit -m "Add description of changes"
   ```

4. Push your branch to GitHub:
   ```bash
   git push origin feature/my-new-feature
   ```

5. Go to GitHub and create a Pull Request to merge your changes into the main branch

## Troubleshooting

- **Database Connection Issues**: Make sure your PostgreSQL service is running and that the credentials in your `.env` file are correct.
- **Missing Uploads Directory**: Create an `uploads` directory in the root of your project if it doesn't exist.
- **OpenAI API Key**: Ensure your OpenAI API key is valid and has not expired.