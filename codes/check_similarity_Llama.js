import fs from "fs";
import csv from "csv-parser";
import { Ollama } from "ollama";

const ollama = new Ollama({
  baseUrl: "http://localhost:11411", 
});

async function chamarLlama(prompt, maxTokens = 200, temperature = 0.4) {
  try {
    const response = await ollama.generate({
      model: "llama3.1:8b",
      prompt,
      stream: false,
      temperature: temperature,
    });
    return response.response.trim();
  } catch (error) {
    console.error("Errorr:", error.message);
    throw error;
  }
}

async function chamarApiLlama(name, motivation, solution, solutionLlm) {
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

  const response = await chamarLlama(prompt, 300, 0.7);
  console.log(`Resultado para ${name}:`, response);

  return response;
}

async function lerCSV(filePath) {
  const results = [];
  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      rows.push(row);
    })
    .on("end", async () => {
      console.log("File loaded.");
      for (const row of rows) {
        const { Name, Motivation, Solution, "Solution LLM": SolutionLLM } = row;
        console.log("Processing:", Name);

        if (Name && Motivation && Solution && SolutionLLM) {
          console.log(`Enviando para modelo local: ${Name}`);
          const similarity = await chamarApiLlama(
            Name,
            Motivation,
            Solution,
            SolutionLLM
          );
          await new Promise((resolve) => setTimeout(resolve, 2100));

          results.push({
            Name,
            Similarity: similarity,
          });
        }
      }

      const output = results
        .map((result) => `${result.Name},${result.Similarity}`)
        .join("\n");

      const outputDir = "resultados";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      fs.writeFileSync(
        `${outputDir}/resultados_gpt-4_llama.csv`,
        "Name,Similarity\n" + output
      );
      console.log(
        "completed"
      );
    });
}

const inputFilePath = "resultados/results-gpt-4.csv";
lerCSV(inputFilePath);
