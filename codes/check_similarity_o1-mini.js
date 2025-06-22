import OpenAI from "openai";
import fs from "fs";
import csv from "csv-parser";

const OPENAI_API_KEY = '';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function chamarGPT(messages, maxTokens = 200, temperature = 0.4) {
  try {
    const response = await openai.chat.completions.create({
      model: "o1-mini",
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error", error.message);
    throw error;
  }
}

async function chamarApiGPT(name, motivation, solution, solutionLlm) {
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

  const response = await chamarGPT(
    [{ role: "user", content: prompt }],
    300,
    0.7
  );

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
      console.log("CSV file loaded successfully.");
      for (const row of rows) {
        const { Name, Motivation, Solution, "Solution LLM": SolutionLLM } = row;
        console.log("Processing:", Name);

        if (Name && Motivation && Solution && SolutionLLM) {
          console.log(`Enviando para API: ${Name}`);
          const similarity = await chamarApiGPT(
            Name,
            Motivation,
            Solution,
            SolutionLLM
          );
          await new Promise((resolve) => setTimeout(resolve, 2100)); // Pausa para evitar limites de taxa da API
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
        `${outputDir}/resultados_o1-mini_o1-mini.csv`,
        "Name,Similarity\n" + output
      );
      console.log(
        "Processamento concluído! Resultados salvos em resultados_gpt.csv"
      );
    });
}

const inputFilePath =
  "resultados/results-o1-mini_o1-mini.csv";

lerCSV(inputFilePath);
