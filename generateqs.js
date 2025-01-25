const cohere = require('cohere-ai');
cohere.init('YOUR_API_KEY'); // Replace with your actual API key

async function generateMathQuestions() {
  const prompt = `
    Generate 10 multiple-choice math questions suitable for 5th-grade students. Each question should have one correct answer and three distractors. Format the output as follows:
    Question: [Question Text]
    A) [Option A]
    B) [Option B]
    C) [Option C]
    D) [Option D]
    Correct Answer: [Letter of Correct Option]
  `;

  try {
    const response = await cohere.generate({
      model: 'command-xlarge-20221108', // Use the appropriate model
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
      stop_sequences: ['Question:'],
    });

    const questions = response.body.generations[0].text.trim();
    console.log(questions);
  } catch (error) {
    console.error('Error generating questions:', error);
  }
}

generateMathQuestions();
