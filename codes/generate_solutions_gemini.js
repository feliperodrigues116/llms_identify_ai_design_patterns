
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = '';
const modelo = 'gemini-1.5-flash';

async function fetchJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

async function chamarGemini(
  prompt
) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelo });

  const response = await model.generateContent(prompt);
  
  console.log('RESPOSTA', response.response.text());

  return response.response.text().trim()
}

async function processarPadrao(pattern) {
  const { id, name, motivation, solution } = pattern;

  const prompt1 = `Based on the following problem:\n"${motivation}"\nPlease provide a solution in a format that resembles a design pattern, similar to the example below. Each answer should be concise, focusing on key components that address the issue effectively.\n\nExample:\nSolution: Ensure that only one instance of the class is created and accessible throughout the program's execution. Implement a static method to create this single instance on the first call and return the same instance on subsequent calls.\n\nProvide the solution Summarized in just one paragraph`

  const solutionLLM = await chamarGemini(prompt1);
  await new Promise((resolve) => setTimeout(resolve, 2100));

  const prompt2 = `Problem:\n"${motivation}"\n\nProposed Solution:\n"${solution}"\n\nAnalyze the proposed solution. Is it the best choice to address the problem? Discuss any potential issues or improvements. provide a solution with Strengths, Potential Issues and Improvements.`;

  const analysisLLM = await chamarGemini(prompt2);
  await new Promise((resolve) => setTimeout(resolve, 2100));

  const thirdPrompt = `
Consider the problem in AI-based systems: 
Name: ${name}.
Problem: ${motivation}

Two solutions are provided below. Compare their similarity using the Likert scale (1 to 5), where:
1 - 'Not at all similar'
2 - 'Slightly similar'
3 - 'Moderately similar'
4 - 'Very similar'
5 - 'Almost identical.'

---
Solutions 1: ${solution}
---
Solution 2: ${solutionLLM}
---
Provide only the similarity score (1-5) as your response.
`;

  const resp = await chamarGemini(thirdPrompt);
  await new Promise((resolve) => setTimeout(resolve, 2100));

  const similar = resp.toLowerCase().trim();

  return {
    Name: name,
    Motivation: motivation,
    Solution: solution,
    'Solution LLM': solutionLLM,
    'Analysis LLM': analysisLLM,
    Similar: similar,
  };
}

(async () => {

  const results = [];
  for (let i = 1; i <= 70; i++) {
    const id = String(i).padStart(3, '0');
    const url = `https://raw.githubusercontent.com/SWE4AI/ai-patterns/main/ai-patterns/patterns/P${id}.json`;
    try {
      const pattern = await fetchJSON(url);
      const result = await processarPadrao(pattern);
      results.push(result);

      await new Promise((resolve) => setTimeout(resolve, 2100));
    } catch (error) {
      console.error(`Error ${id}:`, error);
    }
  }

  const headers = [
    'Name',
    'Motivation',
    'Solution',
    'Solution LLM',
    'Analysis LLM',
    'Similar',
  ];
  const csvContent =
    headers.join(',') +
    '\n' +
    results
      .map((row) =>
        headers
          .map((field) => `"${(row[field] || '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

  const filePath = path.join(
    process.cwd(),
    `results-${modelo}-${new Date().toISOString().replace(/[:]/g, '-')}.csv`
  );
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`Success: ${filePath}`);
})();
