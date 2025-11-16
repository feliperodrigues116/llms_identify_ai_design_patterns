import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const ANTHROPIC_API_KEY = '';
const model = "claude-3-5-sonnet-20240620";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

async function fetchJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

async function chamadaClaude(messages, maxTokens = 200, temperature = 0.4) {
  try {
    const response = await anthropic.messages.create({
      model: model,
      messages: messages
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Errorr in Claude API:', error);
    throw error;
  }
}

async function processarPadrao(pattern) {
  const { id, name, motivation, solution } = pattern;
  const prompt1 = `Based on the following problem:\n"${motivation}"\nPlease provide a solution in a format that resembles a design pattern, similar to the example below. Each answer should be concise, focusing on key components that address the issue effectively.\n\nExample:\nSolution: Ensure that only one instance of the class is created and accessible throughout the program's execution. Implement a static method to create this single instance on the first call and return the same instance on subsequent calls.\n\nProvide the solution Summarized in just one paragraph`

  const solutionLLM = await chamadaClaude(
    [{ role: 'user', content: prompt1 }],
    300,
    0.7
  );

  const prompt2 = `Problem:\n"${motivation}"\n\nProposed Solution:\n"${solution}"\n\nAnalyze the proposed solution. Is it the best choice to address the problem? Discuss any potential issues or improvements. provide a solution with Strengths, Potential Issues and Improvements.`;

  const analysisLLM = await chamadaClaude(
    [{ role: 'user', content: prompt2 }],
    300,
    0.7
  );

  const prompt3 = `Based on the two solutions provided below, compare them and determine if they propose the same approach or if they are fundamentally different. Focus on whether the core strategies and implementation details are truly aligned, rather than just sharing a similar general idea. Respond only with "true" if the solutions are identical in both main idea and approach, or "false" if they represent distinct approaches in either strategy or execution.\n\nSolution 1: ${solution}\nSolution 2: ${solutionLLM}`

  const similarityResponse = await chamadaClaude(
    [{ role: 'user', content: prompt3 }],
    10,
    0.0
  );

  const similar = similarityResponse.toLowerCase().includes('true') ? 'True' : 'False';

  // Retornar todas as informações coletadas
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

      await new Promise((resolve) => setTimeout(resolve, 1100));
    } catch (error) {
      console.error(`Error ${id}:`, error);
    }
  }

  const headers = ['Name', 'Motivation', 'Solution', 'Solution LLM', 'Analysis LLM', 'Similar'];
  const csvContent =
    headers.join(',') +
    '\n' +
    results
      .map((row) =>
        headers.map((field) => `"${(row[field] || '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  const filePath = path.join(process.cwd(), `results-${model}-${(new Date()).toJSON().substring(0, 19).replaceAll(":", "")}.csv`)
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`Success: ${filePath}`);
})();