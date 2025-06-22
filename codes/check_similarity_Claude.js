import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const ANTHROPIC_API_KEY = '';
const model = "claude-3-5-sonnet-20240620";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

async function fetchJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

async function chamarClaude(messages, maxTokens = 200, temperature = 0.4) {
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Errorr:', error);
    throw error;
  }
}

async function chamarApiClaude(name, motivation, solution, solutionLlm) {


  const prompt = `
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
Solution 2: ${solutionLlm}
---
Provide only the similarity score (1-5) as your response.
`;
  const resposta = await chamarClaude(
    [{ role: 'user', content: prompt }],
    300,
    0.7
  );
  console.log(resposta)

  return resposta;
}

async function lerCVS(filePath) {
  const results = [];
  const rows = [];

  // Ler o CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row); 
    })
    .on('end', async () => {
      console.log('CSV file loaded successfully.');
      for (const row of rows) {
        const { Name, Motivation, Solution, 'Solution LLM': SolutionLLM } = row;
        console.log('processing: ', Name)

        if (Name && Motivation && Solution && SolutionLLM) {
          console.log(`Processing: ${Name}`);
          const similarity = await chamarApiClaude(Name, Motivation, Solution, SolutionLLM);
          await new Promise((resolve) => setTimeout(resolve, 2100));
          results.push({
            Name,
            Similarity: similarity,
          });
        }
        // break;
      }

      const output = results
        .map((result) => `${result.Name},${result.Similarity}`)
        .join('\n');

      fs.writeFileSync(`resultados/resultados_gemini_claude.csv`, 'Name,Similarity\n' + output);
      console.log('Processing completed! Results saved in resultados.csv');
    });
}

const inputFilePath = 'resultados/results-gemini-1.5-flash-2024-11-24T22-57-53.507Z.csv';

lerCVS(inputFilePath);