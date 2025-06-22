import fs from 'fs';
import csv from 'csv-parser';
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
  const resposta = await chamarGemini(prompt);
  await new Promise((resolve) => setTimeout(resolve, 2100));
  console.log(resposta)

  // Retornar todas as informações coletadas
  return resposta;
}

async function lerCVS(filePath) {
  const results = [];
  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', async () => {
      console.log('File loaded.');
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

      fs.writeFileSync(`resultados/resultados_gemini_gemini.csv`, 'Name,Similarity\n' + output);
      console.log('Processing completed! Results saved in resultados.csv');
    });
}

const inputFilePath = 'resultados/results-gemini.csv';

lerCVS(inputFilePath);