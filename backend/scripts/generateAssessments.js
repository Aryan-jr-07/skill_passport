const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

const prisma = new PrismaClient();

if (!process.env.GEMINI_API_KEY) {
  console.error('\n❌ ERROR: Please add GEMINI_API_KEY to your backend/.env file.');
  console.error('You can get a free API key from https://aistudio.google.com/app/apikey');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateAssessments() {
  const allSkills = await prisma.skill.findMany();
  console.log(`Checking ${allSkills.length} skills for missing tests...`);

  // Using gemini-flash-latest for high quota (1.5 Flash)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  for (const skill of allSkills) {
    const existingTest = await prisma.skillTest.findFirst({
      where: { skillId: skill.id }
    });

    if (existingTest) {
      console.log(`✅ Test already exists for ${skill.name}. Skipping...`);
      continue;
    }

    console.log(`🤖 Generating assessment for ${skill.name}...`);
    const prompt = `You are an expert assessment designer.
Create a cheat-resistant skill assessment for the skill: ${skill.name} (${skill.category}).

Requirements:
1. Include EXACTLY 10 MCQs and 3 subjective/scenario questions.
2. Questions must test real understanding, not simple definitions.
3. Avoid direct Googleable questions. Focus on scenario-based and application-based problems.
4. For MCQs: 4 options each, exactly 1 correct answer.
5. For subjective questions: require a step-by-step reasoning or practical strategy.
6. Make sure to vary difficulty levels (Easy, Medium, Hard).
7. Ensure 2 questions require interpretation and 1 is a case study.

IMPORTANT! You MUST reply ONLY with a valid JSON array representing the questions. Do NOT wrap it in markdown \`\`\`json blocks.
The array should mix the MCQs and subjective questions seamlessly.

For MCQs, use this strict structure:
{
  "id": "m1",
  "text": "[Difficulty] Question text here...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option B",
  "explanation": "Why this is correct."
}

For subjective questions, omit 'options' and 'correctAnswer'. Provide an 'explanationKey' instead:
{
  "id": "s1",
  "text": "[Subjective/Case Study] Question text...",
  "explanationKey": "Key points that the grader should look for in the user's answer."
}`;

    try {
      const result = await model.generateContent(prompt);
      // Clean parsing in case the LLM still returns markdown blocks
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedQuestions = JSON.parse(responseText);

      await prisma.skillTest.create({
        data: {
          skillId: skill.id,
          title: `${skill.name} Professional Assessment`,
          description: `A comprehensive test evaluating your practical knowledge and problem-solving abilities in ${skill.name}.`,
          questions: JSON.stringify(parsedQuestions),
          difficultyLevel: 'mixed',
          timeLimit: 30, // 30 minutes
          passingScore: 70
        }
      });
      console.log(`🎉 Successfully generated and saved test for ${skill.name}!`);

      // 12 second delay to respect rate limits (5 RPM for free tier 2.5 flash)
      await new Promise(resolve => setTimeout(resolve, 12000));
    } catch (e) {
      console.error(`❌ Failed to generate test for ${skill.name}: JSON parse mapping failed or API limit reached. Details: ${e.message}`);
    }
  }

  console.log('\n🌟 All test generations are complete!');
  await prisma.$disconnect();
}

generateAssessments();
