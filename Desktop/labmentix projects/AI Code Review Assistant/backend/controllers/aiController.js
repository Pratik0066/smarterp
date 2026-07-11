const OpenAI = require('openai');

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

function generateMockReview(code, language) {
  const lines = code.split('\n');
  const findings = { bugs: [], code_smells: [], improvements: [], performance: [], security: [], naming: [], refactoring: [] };

  if (lines.length > 50) {
    findings.code_smells.push({ issue: 'Function/file is too long', explanation: `${lines.length} lines exceeds recommended 50 lines`, suggested_fix: 'Break into smaller, focused functions' });
  }

  const hasComments = /\/\/|#|\/\*|\"\"\"|''''/.test(code);
  if (!hasComments && lines.length > 5) {
    findings.improvements.push({ issue: 'No documentation found', explanation: 'Code lacks comments or documentation', suggested_fix: 'Add JSDoc, docstrings, or inline comments for complex logic' });
  }

  const hasErrorHandling = /try|catch|throw|except|raise/.test(code);
  if (!hasErrorHandling && lines.length > 10) {
    findings.bugs.push({ issue: 'Missing error handling', explanation: 'No try-catch or error handling detected', suggested_fix: 'Add try-catch blocks around critical operations' });
  }

  if (/eval|exec|setTimeout.*string|setInterval.*string/.test(code)) {
    findings.security.push({ issue: 'Dynamic code execution detected', explanation: 'Functions that execute dynamic code are security risks', suggested_fix: 'Replace with safer alternatives' });
  }

  if (/console\.(log|debug|info)|print\s*\(|System\.out/.test(code)) {
    findings.improvements.push({ issue: 'Debug statements in code', explanation: 'Logging statements should be removed for production', suggested_fix: 'Use a proper logging framework or remove' });
  }

  if (!/test|spec|describe|it\s*\(|def\s+test_/.test(code) && lines.length > 20) {
    findings.improvements.push({ issue: 'No tests detected', explanation: 'Code lacks associated test cases', suggested_fix: 'Write unit tests to ensure reliability' });
  }

  if (/password|secret|token|api.?key/i.test(code) && !/process\.env/.test(code)) {
    findings.security.push({ issue: 'Potential hardcoded secrets', explanation: 'Secrets appear to be hardcoded in the source', suggested_fix: 'Move to environment variables' });
  }

  if (lines.filter(l => l.length > 120).length > 3) {
    findings.naming.push({ issue: 'Very long lines detected', explanation: 'Multiple lines exceed 120 characters', suggested_fix: 'Break long lines for readability' });
  }

  const uniqueVars = new Set();
  lines.forEach(l => {
    const match = l.match(/\b(const|let|var|def)\s+(\w+)/);
    if (match) uniqueVars.add(match[2]);
  });
  if (uniqueVars.size > 10) {
    findings.refactoring.push({ issue: 'Many local variables', explanation: `${uniqueVars.size} unique variables - function may be doing too much`, suggested_fix: 'Extract logic into smaller functions' });
  }

  let score = 100;
  Object.values(findings).forEach(arr => { score -= arr.length * 5; });
  score = Math.max(20, Math.min(95, score));

  const langName = { javascript: 'JavaScript', python: 'Python', typescript: 'TypeScript', java: 'Java' }[language] || language;

  return {
    explanation: `This ${langName} code spans ${lines.length} lines with ${uniqueVars.size} variables. ` +
      `${findings.bugs.length > 0 ? `${findings.bugs.length} potential bug(s) detected. ` : 'No critical bugs found. '}` +
      `${findings.security.length > 0 ? `${findings.security.length} security concern(s) identified.` : 'Basic security checks passed.'}`,
    score,
    ...findings,
  };
}

exports.reviewCode = async (req, res) => {
  try {
    const { code, language, staticAnalysis } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const openai = getOpenAIClient();
    if (!openai) {
      return res.json({ success: true, review: generateMockReview(code, language) });
    }

    const prompt = `You are an expert code reviewer. Analyze this ${language || 'JavaScript'} code.

Static analysis: ${JSON.stringify(staticAnalysis?.summary || {}, null, 2)}

Code:
\`\`\`${language || 'javascript'}
${code}
\`\`\`

Respond ONLY with valid JSON:
{
  "explanation": "What the code does",
  "score": 75,
  "bugs": [{"issue": "", "explanation": "", "suggested_fix": ""}],
  "code_smells": [{"issue": "", "explanation": "", "suggested_fix": ""}],
  "improvements": [{"issue": "", "explanation": "", "suggested_fix": ""}],
  "performance": [{"issue": "", "explanation": "", "suggested_fix": ""}],
  "security": [{"issue": "", "explanation": "", "suggested_fix": ""}],
  "naming": [{"issue": "", "explanation": "", "suggested_fix": ""}],
  "refactoring": [{"issue": "", "explanation": "", "suggested_fix": ""}]
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
    } catch { review = generateMockReview(code, language); }

    res.json({ success: true, review });
  } catch {
    res.json({ success: true, review: generateMockReview(req.body.code, req.body.language) });
  }
};

exports.explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const openai = getOpenAIClient();

    if (!openai) {
      const lines = code.split('\n');
      return res.json({
        success: true,
        explanation: `This ${language || 'JavaScript'} code contains ${lines.length} lines. ` +
          `It defines ${code.match(/function|def|class/g)?.length || 0} functions/classes. ` +
          `(AI explanation requires OpenAI API key for detailed analysis)`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Explain what this ${language || 'code'} does in simple terms. Be clear and concise:\n\n\`\`\`\n${code}\n\`\`\``,
      }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    res.json({ success: true, explanation: completion.choices[0].message.content });
  } catch {
    res.json({ success: true, explanation: 'AI explanation is currently unavailable.' });
  }
};

exports.generateDocs = async (req, res) => {
  try {
    const { code, language } = req.body;
    const openai = getOpenAIClient();

    if (!openai) {
      return res.json({
        success: true,
        documentation: `/**\n * Code Review Documentation\n * Language: ${language || 'JavaScript'}\n * \n * (AI documentation requires OpenAI API key)\n */`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Generate comprehensive ${language === 'python' ? 'docstrings' : 'JSDoc'} documentation for this code:\n\n\`\`\`\n${code}\n\`\`\``,
      }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    res.json({ success: true, documentation: completion.choices[0].message.content });
  } catch {
    res.json({ success: true, documentation: 'AI documentation generation is currently unavailable.' });
  }
};
