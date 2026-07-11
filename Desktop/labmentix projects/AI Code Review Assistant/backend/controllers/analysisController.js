const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const LANGUAGE_CONFIG = {
  javascript: { ext: '.js', linter: 'eslint' },
  python: { ext: '.py', linter: 'pylint' },
  typescript: { ext: '.ts', linter: 'eslint' },
};

function getLanguageFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.js': 'javascript', '.jsx': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c', '.cpp': 'cpp', '.cs': 'csharp',
    '.go': 'go', '.rb': 'ruby', '.php': 'php',
  };
  return map[ext] || 'javascript';
}

function analyzeComplexity(code, language) {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const blankLines = lines.filter(l => l.trim() === '').length;
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#') || l.trim().startsWith('/*')).length;
  const codeLines = totalLines - blankLines - commentLines;

  let functionCount = 0;
  let classCount = 0;
  let cyclomaticComplexity = 1;
  let maxFunctionComplexity = 1;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (/^\s*(function\s|const\s+\w+\s*=\s*(\(|async\s*\())/.test(trimmed)) functionCount++;
    if (/^\s*class\s/.test(trimmed)) classCount++;
    if (/\b(if|else if|elif|else|while|for|case|catch|&&|\|\||\?)\b/.test(trimmed)) cyclomaticComplexity++;
    if (/\b(function|def|=>)\b/.test(trimmed)) {
      maxFunctionComplexity = Math.max(maxFunctionComplexity, 2);
    }
  });

  let score = 100;
  if (cyclomaticComplexity > 10) score -= 20;
  else if (cyclomaticComplexity > 5) score -= 10;
  if (totalLines > 500) score -= 15;
  else if (totalLines > 200) score -= 5;

  return {
    total_lines: totalLines,
    code_lines: codeLines,
    blank_lines: blankLines,
    comment_lines: commentLines,
    function_count: functionCount,
    class_count: classCount,
    cyclomatic_complexity: cyclomaticComplexity,
    max_function_complexity: maxFunctionComplexity,
    maintainability_score: Math.max(0, score),
  };
}

function runStaticAnalysis(code, language, filename) {
  const findings = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;

    // Common issues across languages
    if (/eval\s*\(/.test(trimmed)) {
      findings.push({
        severity: 'error',
        category: 'security',
        issue: 'Use of eval() detected',
        explanation: 'eval() can execute arbitrary code and is a security risk',
        suggested_fix: 'Avoid using eval(). Use safer alternatives like JSON.parse() or function constructors.',
        file_name: filename,
        line_number: lineNum,
        source: 'static_analysis',
      });
    }

    if (/console\.(log|debug|info)\s*\(/.test(trimmed)) {
      findings.push({
        severity: 'warning',
        category: 'best_practice',
        issue: 'Console statement found',
        explanation: 'Console statements should not be left in production code',
        suggested_fix: 'Remove console statements or use a proper logging library.',
        file_name: filename,
        line_number: lineNum,
        source: 'static_analysis',
      });
    }

    if (/var\s+/.test(trimmed)) {
      findings.push({
        severity: 'warning',
        category: 'code_style',
        issue: 'Use of "var" detected',
        explanation: '"var" has function scope. Use "const" or "let" for block scope.',
        suggested_fix: 'Replace "var" with "const" or "let".',
        file_name: filename,
        line_number: lineNum,
        source: 'static_analysis',
      });
    }

    if (/\b==\b/.test(trimmed) && !/\b===\b/.test(trimmed) && !/!=/.test(trimmed)) {
      findings.push({
        severity: 'info',
        category: 'code_style',
        issue: 'Loose equality (==) used',
        explanation: 'Loose equality can cause unexpected type coercion',
        suggested_fix: 'Use strict equality (===) instead.',
        file_name: filename,
        line_number: lineNum,
        source: 'static_analysis',
      });
    }

    if (/TODO|FIXME|HACK|XXX/.test(trimmed)) {
      findings.push({
        severity: 'info',
        category: 'code_quality',
        issue: 'TODO/FIXME comment found',
        explanation: 'Unresolved TODO or FIXME comment detected',
        suggested_fix: 'Address the TODO/FIXME or create a tracked issue.',
        file_name: filename,
        line_number: lineNum,
        source: 'static_analysis',
      });
    }

    if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(trimmed)) {
      findings.push({
        severity: 'warning',
        category: 'error_handling',
        issue: 'Empty catch block',
        explanation: 'Swallowing errors silently makes debugging difficult',
        suggested_fix: 'Handle the error properly or log it.',
        file_name: filename,
        line_number: lineNum,
        source: 'static_analysis',
      });
    }

    // Python-specific
    if (language === 'python') {
      if (/print\s*\(/.test(trimmed) && !trimmed.startsWith('#')) {
        findings.push({
          severity: 'info',
          category: 'code_quality',
          issue: 'Print statement found',
          explanation: 'Print statements should not be left in production code',
          suggested_fix: 'Use the logging module instead.',
          file_name: filename,
          line_number: lineNum,
          source: 'static_analysis',
        });
      }
    }
  });

  return findings;
}

exports.analyzeCode = async (req, res) => {
  try {
    const { code, language, filename } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const detectedLanguage = language || getLanguageFromFilename(filename || 'code.js');
    const analysisFilename = filename || `code${LANGUAGE_CONFIG[detectedLanguage]?.ext || '.js'}`;

    const staticFindings = runStaticAnalysis(code, detectedLanguage, analysisFilename);
    const complexity = analyzeComplexity(code, detectedLanguage);

    let errorCount = staticFindings.filter(f => f.severity === 'error').length;
    let warningCount = staticFindings.filter(f => f.severity === 'warning').length;

    let score = complexity.maintainability_score;
    score -= errorCount * 5;
    score -= warningCount * 2;
    score = Math.max(0, Math.min(100, score));

    res.json({
      success: true,
      analysis: {
        language: detectedLanguage,
        filename: analysisFilename,
        score,
        complexity,
        findings: staticFindings,
        summary: {
          total_issues: staticFindings.length,
          errors: errorCount,
          warnings: warningCount,
          infos: staticFindings.filter(f => f.severity === 'info').length,
          suggestions: staticFindings.filter(f => f.severity === 'suggestion').length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
