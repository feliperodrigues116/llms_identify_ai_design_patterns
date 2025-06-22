import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = '';

async function fetchJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

async function openaiChatCompletion(messages, maxTokens = 200, temperature = 0.4) {
  //const url = 'http://localhost:11434/api/generate'
  const url = 'https://api.openai.com/v1/chat/completions'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Errorr(`erro: ${response.status} ${response.statusText}\n${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function processar(pattern) {
  const { id, name, motivation, solution } = pattern;

  const firstPrompt = `Based on the following problem:\n"${motivation}"\nPlease provide a solution in a format that resembles a design pattern, similar to the example below. Each answer should be concise, focusing on key components that address the issue effectively.\n\nExample:\nSolution: Ensure that only one instance of the class is created and accessible throughout the program's execution. Implement a static method to create this single instance on the first call and return the same instance on subsequent calls.\n\nProvide the solution Summarized in just one paragraph`

  return {
    Name: name,
    Motivation: motivation,
    Solution: solution,
    prompt: firstPrompt
  };
}

(async () => {
  const results = [];
  for (let i = 1; i <= 70; i++) {
    const id = String(i).padStart(3, '0');
    const url = `https://raw.githubusercontent.com/SWE4AI/ai-patterns/main/ai-patterns/patterns/P${id}.json`;
    try {
      const pattern = await fetchJSON(url);
      console.log(`Processing pattern ${id}: ${pattern.name}`);
      const result = await processar(pattern);
      results.push(result);

      await new Promise((resolve) => setTimeout(resolve, 1100));
    } catch (error) {
      console.error(`Errorr processing pattern ${id}:`, error);
    }
  }

  const headers = ['Name', 'Motivation', 'Solution', 'prompt'];
  const csvContent =
    headers.join(',') +
    '\n' +
    results
      .map((row) =>
        headers.map((field) => `"${(row[field] || '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  fs.writeFileSync(path.join(process.cwd(), 'prompt.csv'), csvContent, 'utf8');
  console.log('Process completed. Results saved to results.csv');
})();
