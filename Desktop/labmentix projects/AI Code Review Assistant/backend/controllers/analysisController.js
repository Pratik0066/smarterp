const path = require('path');

const JS_RULES = [
  { pattern: /eval\s*\(/, severity: 'error', category: 'security', issue: 'Use of eval() detected', explanation: 'eval() can execute arbitrary code and is a security risk', suggested_fix: 'Avoid eval(). Use safer alternatives.' },
  { pattern: /console\.(log|debug|info)\s*\(/, severity: 'warning', category: 'best_practice', issue: 'Console statement in code', explanation: 'Console statements should not be left in production code', suggested_fix: 'Use a logging library or remove.' },
  { pattern: /\bvar\s+/, severity: 'warning', category: 'code_style', issue: 'Use of "var" detected', explanation: 'var has function scope, use const/let for block scope', suggested_fix: 'Replace var with const or let.' },
  { pattern: /===|!==/, severity: null, category: null },
  { pattern: /[^!=<>]==[^=]/, severity: 'info', category: 'code_style', issue: 'Loose equality (==) used', explanation: 'Can cause unexpected type coercion', suggested_fix: 'Use strict equality (===).' },
  { pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/, severity: 'warning', category: 'error_handling', issue: 'Empty catch block', explanation: 'Errors are being swallowed silently', suggested_fix: 'Log or handle the error.' },
  { pattern: /TODO|FIXME|HACK|XXX/, severity: 'info', category: 'code_quality', issue: 'Unresolved TODO/FIXME comment', explanation: 'Pending work marker found', suggested_fix: 'Address the TODO or create a tracked issue.' },
  { pattern: /\balert\s*\(/, severity: 'warning', category: 'best_practice', issue: 'alert() dialog in code', explanation: 'alert() blocks execution and is poor UX', suggested_fix: 'Use toast notifications or modal dialogs.' },
  { pattern: /document\.write\s*\(/, severity: 'error', category: 'security', issue: 'document.write() detected', explanation: 'Overwrites the entire document and is a security risk', suggested_fix: 'Use DOM manipulation methods instead.' },
  { pattern: /window\.(location|open)\s*=/, severity: 'info', category: 'best_practice', issue: 'Direct window manipulation', explanation: 'Direct navigation can be confusing', suggested_fix: 'Use a router or clear navigation pattern.' },
  { pattern: /setTimeout\s*\(\s*["'][^"']+["']\s*,/, severity: 'error', category: 'security', issue: 'String in setTimeout', explanation: 'Passing a string to setTimeout is equivalent to eval()', suggested_fix: 'Pass a function instead of a string.' },
  { pattern: /setInterval\s*\(\s*["'][^"']+["']\s*,/, severity: 'error', category: 'security', issue: 'String in setInterval', explanation: 'Passing a string to setInterval is equivalent to eval()', suggested_fix: 'Pass a function instead of a string.' },
  { pattern: /new Function\s*\(/, severity: 'warning', category: 'security', issue: 'Dynamic function creation', explanation: 'new Function() creates code from strings - security risk', suggested_fix: 'Use regular function declarations or closures.' },
  { pattern: /\b\d{10,}\b/, severity: 'info', category: 'code_quality', issue: 'Magic number detected', explanation: 'Hard-coded numeric literals reduce readability', suggested_fix: 'Extract to a named constant.' },
  { pattern: /\b(password|secret|token|api_key)\s*[:=]\s*["'][^"']+["']/i, severity: 'error', category: 'security', issue: 'Hardcoded secret/password', explanation: 'Secrets should never be in source code', suggested_fix: 'Use environment variables.' },
  { pattern: /require\s*\(\s*["']child_process["']\)/, severity: 'warning', category: 'security', issue: 'Child process module imported', explanation: 'child_process can execute system commands', suggested_fix: 'Ensure input is sanitized if used.' },
  { pattern: /\+[\s]*["']/, severity: null },
  { pattern: /["']\s*\+/, severity: null },
  { pattern: /\+\s*["']\s*\+/, severity: null },
  { pattern: /["']\s*\+\s*["']/, severity: 'info', category: 'code_style', issue: 'String concatenation with +', explanation: 'Template literals are more readable', suggested_fix: 'Use template literals: `text ${var}`' },
  { pattern: /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{1000,}?\}/, severity: 'warning', category: 'code_smells', issue: 'Function is very long', explanation: 'Long functions are harder to understand and test', suggested_fix: 'Break into smaller, focused functions.' },
  { pattern: /new Promise\s*\(\s*function/, severity: 'info', category: 'code_style', issue: 'Promise constructor with function keyword', explanation: 'Arrow functions are more concise for Promises', suggested_fix: 'Use arrow function: new Promise((resolve, reject) => ...)' },
];

const PY_RULES = [
  { pattern: /print\s*\(/, severity: 'info', category: 'code_quality', issue: 'Print statement found', explanation: 'Print statements should not be in production code', suggested_fix: 'Use the logging module instead.' },
  { pattern: /except\s*:/.test ? /except\s*:$/m : /except\s*:/, severity: 'warning', category: 'error_handling', issue: 'Bare except clause', explanation: 'Bare except catches all exceptions including KeyboardInterrupt', suggested_fix: 'Catch specific exceptions.' },
  { pattern: /import\s+\*/, severity: 'warning', category: 'code_style', issue: 'Wildcard import (from X import *)', explanation: 'Pollutes namespace and makes dependencies unclear', suggested_fix: 'Import specific names: from X import name1, name2' },
  { pattern: /exec\s*\(/, severity: 'error', category: 'security', issue: 'Use of exec() detected', explanation: 'exec() can execute arbitrary code', suggested_fix: 'Avoid exec(). Use safer alternatives.' },
  { pattern: /eval\s*\(/, severity: 'error', category: 'security', issue: 'Use of eval() detected', explanation: 'eval() can execute arbitrary code', suggested_fix: 'Use ast.literal_eval() for safe evaluation.' },
  { pattern: /#.*TODO|#.*FIXME|#.*HACK|#.*XXX/, severity: 'info', category: 'code_quality', issue: 'Unresolved TODO/FIXME comment', explanation: 'Pending work marker found', suggested_fix: 'Address the TODO.' },
  { pattern: /except\s+\w+.*:\s*pass/, severity: 'warning', category: 'error_handling', issue: 'Silently passing on exception', explanation: 'Errors are being ignored', suggested_fix: 'Log the exception or handle it properly.' },
  { pattern: /__import__\s*\(/, severity: 'warning', category: 'security', issue: 'Dynamic import via __import__', explanation: 'Dynamic imports can be a security risk', suggested_fix: 'Use regular import statements.' },
  { pattern: /\blambda\s+.*:(?:(?!return).)*$/, severity: 'info', category: 'code_style', issue: 'Complex lambda function', explanation: 'Complex lambdas reduce readability', suggested_fix: 'Use a regular function definition.' },
  { pattern: /open\s*\([^)]*\)\s*$/, severity: 'info', category: 'best_practice', issue: 'File opened without context manager', explanation: 'Files opened without with-statement may not be properly closed', suggested_fix: 'Use: with open("file") as f:' },
];

const JAVA_RULES = [
  { pattern: /System\.out\.print/, severity: 'warning', category: 'best_practice', issue: 'System.out.println in code', explanation: 'Use a logging framework instead', suggested_fix: 'Use SLF4J or java.util.logging.' },
  { pattern: /catch\s*\([^)]+\)\s*\{\s*\}/, severity: 'warning', category: 'error_handling', issue: 'Empty catch block', explanation: 'Swallowing exceptions silently', suggested_fix: 'Log the exception or rethrow.' },
  { pattern: /\.printStackTrace\(\)/, severity: 'warning', category: 'best_practice', issue: 'printStackTrace() called', explanation: 'Stack traces should go to a logger', suggested_fix: 'Use logger.error("msg", exception)' },
  { pattern: /String\s+\w+\s*=\s*"/, severity: 'info', category: 'performance', issue: 'String concatenation in loop', explanation: 'Use StringBuilder for multiple concatenations', suggested_fix: 'Use StringBuilder or String.format().' },
  { pattern: /new\s+Integer\(|new\s+Boolean\(|new\s+Long\(/, severity: 'warning', category: 'code_style', issue: 'Deprecated wrapper constructor', explanation: 'Wrapper constructors are deprecated since Java 9', suggested_fix: 'Use Integer.valueOf(), Boolean.valueOf(), etc.' },
];

const RULES_MAP = {
  javascript: JS_RULES,
  typescript: JS_RULES,
  python: PY_RULES,
  java: JAVA_RULES,
};

function analyzeComplexity(code, language) {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const blankLines = lines.filter(l => l.trim() === '').length;
  const commentPatterns = language === 'python'
    ? [/^\s*#/]
    : [/^\s*\/\//, /^\s*\/?\*/, /^\s*\*/, /^\s*\*\//];
  const commentLines = lines.filter(l => commentPatterns.some(p => p.test(l))).length;
  const codeLines = totalLines - blankLines - commentLines;

  let functionCount = 0;
  let classCount = 0;
  let cyclomaticComplexity = 1;

  const functionPatterns = language === 'python'
    ? [/^\s*def\s+\w+/, /^\s*lambda\s+/]
    : [/^\s*(function\s|const\s+\w+\s*=\s*(\(|async\s*\())/, /^\s*(async\s+)?function\s+\w+/, /=>\s*\{/];
  const classPattern = /^\s*(class\s+\w+|public\s+class\s+\w+)/;
  const complexityKeywords = language === 'python'
    ? /\b(if|elif|else|while|for|and|or|not)\b/
    : /\b(if|else if|else|while|for|case|catch|&&|\|\||\?|switch)\b/;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (functionPatterns.some(p => p.test(trimmed))) functionCount++;
    if (classPattern.test(trimmed)) classCount++;
    if (complexityKeywords.test(trimmed)) cyclomaticComplexity++;
  });

  let score = 100;
  if (cyclomaticComplexity > 20) score -= 30;
  else if (cyclomaticComplexity > 10) score -= 20;
  else if (cyclomaticComplexity > 5) score -= 10;
  if (totalLines > 500) score -= 20;
  else if (totalLines > 200) score -= 10;
  if (functionCount > 20) score -= 10;
  if (classCount > 10) score -= 10;

  return {
    total_lines: totalLines,
    code_lines: codeLines,
    blank_lines: blankLines,
    comment_lines: commentLines,
    function_count: functionCount,
    class_count: classCount,
    cyclomatic_complexity: cyclomaticComplexity,
    maintainability_score: Math.max(0, Math.min(100, score)),
  };
}

function runStaticAnalysis(code, language, filename) {
  const findings = [];
  const rules = RULES_MAP[language] || JS_RULES;
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    rules.forEach(rule => {
      if (!rule.pattern) return;
      try {
        if (rule.pattern.test(line)) {
          findings.push({
            severity: rule.severity,
            category: rule.category,
            issue: rule.issue,
            explanation: rule.explanation,
            suggested_fix: rule.suggested_fix,
            file_name: filename,
            line_number: lineNum,
            source: 'static_analysis',
          });
        }
      } catch { /* regex error */ }
    });
  });

  if (lines.length > 300) {
    findings.push({
      severity: 'warning',
      category: 'code_smells',
      issue: 'File is very long (' + lines.length + ' lines)',
      explanation: 'Long files are harder to navigate and maintain',
      suggested_fix: 'Split into smaller, focused modules.',
      file_name: filename,
      line_number: null,
      source: 'static_analysis',
    });
  }

  const duplicateLines = lines.filter((l, i) => l.trim() && lines.indexOf(l) !== i);
  if (duplicateLines.length > 5) {
    findings.push({
      severity: 'info',
      category: 'code_smells',
      issue: 'Potential duplicate code detected',
      explanation: 'Multiple identical lines found',
      suggested_fix: 'Extract repeated code into reusable functions.',
      file_name: filename,
      line_number: null,
      source: 'static_analysis',
    });
  }

  return findings;
}

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

exports.analyzeCode = (req, res) => {
  try {
    const { code, language, filename } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const detectedLanguage = language || getLanguageFromFilename(filename || 'code.js');
    const analysisFilename = filename || `code.${detectedLanguage === 'python' ? 'py' : 'js'}`;

    const findings = runStaticAnalysis(code, detectedLanguage, analysisFilename);
    const complexity = analyzeComplexity(code, detectedLanguage);

    const errorCount = findings.filter(f => f.severity === 'error').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;

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
        findings,
        summary: { total_issues: findings.length, errors: errorCount, warnings: warningCount, infos: infoCount },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeComplexity, runStaticAnalysis, getLanguageFromFilename };
