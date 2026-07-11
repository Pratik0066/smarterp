const OpenAI = require('openai');

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

exports.reviewCode = async (req, res) => {
  try {
    const { code, language, staticAnalysis } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required for review' });
    }

    const openai = getOpenAIClient();

    if (!openai) {
      const mockReview = generateMockReview(code, language);
      return res.json({ success: true, review: mockReview });
    }

    const prompt = `You are an expert code reviewer. Analyze the following ${language || 'code'} code and provide:
1. A list of bugs found
2. Code smells
3. Suggestions for improvement
4. Performance optimization tips
5. Security recommendations
6. Better variable/function naming suggestions
7. Refactoring recommendations
8. A brief explanation of what the code does
9. An overall code quality score from 0-100

Static analysis results:
${JSON.stringify(staticAnalysis, null, 2)}

Code to review:
\`\`\`${language || 'javascript'}
${code}
\`\`\`

Respond in JSON format:
{
  "explanation": "Brief explanation of the code",
  "score": 75,
  "bugs": [{"issue": "...", "explanation": "...", "suggested_fix": "...", "line_number": null}],
  "code_smells": [{"issue": "...", "explanation": "...", "suggested_fix": "..."}],
  "improvements": [{"issue": "...", "explanation": "...", "suggested_fix": "..."}],
  "performance": [{"issue": "...", "explanation": "...", "suggested_fix": "..."}],
  "security": [{"issue": "...", "explanation": "...", "suggested_fix": "..."}],
  "naming": [{"issue": "...", "explanation": "...", "suggested_fix": "..."}],
  "refactoring": [{"issue": "...", "explanation": "...", "suggested_fix": "..."}]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;
    let review;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      review = jsonMatch ? JSON.parse(jsonMatch[0]) : generateMockReview(code, language);
    } catch {
      review = generateMockReview(code, language);
    }

    res.json({ success: true, review });
  } catch (error) {
    const mockReview = generateMockReview(req.body.code, req.body.language);
    res.json({ success: true, review: mockReview });
  }
};

function generateMockReview(code, language) {
  const lines = code.split('\n');
  const issues = [];

  if (lines.length > 50) {
    issues.push({
      category: 'code_smells',
      issue: 'Function is too long',
      explanation: 'Long functions are harder to understand and maintain',
      suggested_fix: 'Break the function into smaller, focused functions',
    });
  }

  if (!/\/\/|#|\/\*|\*\/|\"\"\"/.test(code)) {
    issues.push({
      category: 'improvements',
      issue: 'No comments found',
      explanation: 'Code lacks documentation comments',
      suggested_fix: 'Add JSDoc or inline comments to explain complex logic',
    });
  }

  const hasErrorHandling = /try|catch|throw|except/.test(code);
  if (!hasErrorHandling && lines.length > 10) {
    issues.push({
      category: 'bugs',
      issue: 'Missing error handling',
      explanation: 'No error handling detected in the code',
      suggested_fix: 'Add try-catch blocks or error handling for critical operations',
    });
  }

  return {
    explanation: `This ${language || 'JavaScript'} code contains ${lines.length} lines. It appears to perform operations that would benefit from additional error handling and documentation.`,
    score: Math.max(40, Math.min(90, 100 - issues.length * 10)),
    bugs: issues.filter(i => i.category === 'bugs'),
    code_smells: issues.filter(i => i.category === 'code_smells'),
    improvements: [
      ...issues.filter(i => i.category === 'improvements'),
      { issue: 'Add unit tests', explanation: 'No tests found', suggested_fix: 'Write unit tests to ensure code reliability' },
    ],
    performance: issues.filter(i => i.category === 'performance'),
    security: issues.filter(i => i.category === 'security'),
    naming: [],
    refactoring: issues.filter(i => i.category === 'refactoring'),
  };
}

exports.explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    const openai = getOpenAIClient();
    if (!openai) {
      return res.json({
        success: true,
        explanation: `This is ${language || 'JavaScript'} code. It contains ${code.split('\n').length} lines of code. (AI explanation requires OpenAI API key)`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Explain what this ${language || 'code'} does in simple terms:\n\n\`\`\`\n${code}\n\`\`\``,
      }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    res.json({
      success: true,
      explanation: completion.choices[0].message.content,
    });
  } catch (error) {
    res.json({
      success: true,
      explanation: 'AI explanation is currently unavailable. Please add your OpenAI API key to enable this feature.',
    });
  }
};

exports.generateDocs = async (req, res) => {
  try {
    const { code, language } = req.body;

    const openai = getOpenAIClient();
    if (!openai) {
      return res.json({
        success: true,
        documentation: `/**\n * Documentation for ${language || 'JavaScript'} code\n * (AI documentation requires OpenAI API key)\n */`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Generate comprehensive documentation (JSDoc/docstring format) for this ${language || 'code'}:\n\n\`\`\`\n${code}\n\`\`\``,
      }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    res.json({
      success: true,
      documentation: completion.choices[0].message.content,
    });
  } catch (error) {
    res.json({
      success: true,
      documentation: 'AI documentation generation is currently unavailable.',
    });
  }
};
