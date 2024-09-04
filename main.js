#!/usr/bin/env node

import { execSync } from 'child_process';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

config();

// Helper to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the facts directory exists
if (!fs.existsSync(path.join(__dirname, 'facts'))) {
  fs.mkdirSync(path.join(__dirname, 'facts'));
}

// Define the schema using Zod
const schema = z.object({
  branchName: z.string().describe("The name of the branch"),
  commits: z.array(z.object({
    city: z.string().describe("The name of the city"),
    message: z.string().describe("The commit message"),
    facts: z.string().describe("The facts about the city"),
  })).describe("The list of commits"),
  prTitle: z.string().describe("The title of the pull request"),
  prDescription: z.string().describe("The description of the pull request"),
});

const model = new ChatOpenAI({
  model: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const structuredLlm = model.withStructuredOutput(schema);

/**
 * Generates structured output for branch name, commit messages, city facts,
 * and PR details using the Langchain API.
 *
 * @returns {Promise<{branchName: string, commits: Array<{city: string, message: string, facts: string}>, prTitle: string, prDescription: string}>}
 * The generated structured output.
 */
async function generateStructuredOutput() {
  const query = `
    Generate a meaningful branch name, commit messages, city facts,
    and PR details for a JavaScript repository. The output should be in structured JSON format.
  `;

  const response = await structuredLlm.invoke(query);
  console.log(response)
  return response;
}

/**
 * Main function to create a dummy pull request.
 *
 * This function performs the following steps:
 * 1. Creates and switches to a new branch.
 * 2. Generates dummy commits with facts about random cities.
 * 3. Pushes the branch to the remote repository.
 * 4. Generates a pull request title and description.
 * 5. Creates a pull request using the GitHub CLI.
 */
async function main() {
  try {
    const fggg = await generateStructuredOutput()
    // Generate structured output
    const { branchName, commits, prTitle, prDescription } = fggg;

    // Create and switch to a new branch
    execSync(`git checkout -b ${branchName}`);

    // Create dummy commits
    for (const { city, message, facts } of commits) {
      const filePath = path.join(__dirname, `facts/${city.replace(/\s+/g, '_').toLowerCase()}.txt`);
      fs.writeFileSync(filePath, facts);
      execSync(`git add ${filePath}`);
      execSync(`git commit -m "${message}"`);
    }

    // Push the branch to the remote repository
    execSync(`git push origin ${branchName}`);

    // Create a pull request using GitHub CLI
    const prCreateOutput = execSync(`gh pr create --title "${prTitle}" --body "${prDescription}" --head ${branchName} --base master`).toString();
    const prUrlMatch = prCreateOutput.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/(\d+)/);
    const prNumber = prUrlMatch[1];
    if (!prUrlMatch) {
        throw new Error('Failed to extract PR number from URL.');
    } else {
      console.log(`Created pull request #${prNumber}`);
      execSync(`gh pr merge ${prNumber} --squash --admin`);
      console.log('Pull request was merged to master.');
    }

    console.log("Done")
  } finally {
    console.log("Synchronising master...")
    execSync(`git checkout master`);
    execSync(`git pull`);
    execSync(`git fetch --prune`);
  }
}

main().catch(console.error);
