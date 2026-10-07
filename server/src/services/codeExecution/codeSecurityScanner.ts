/**
 * Code Security Scanner
 * Pre-execution static analysis and security filter for untrusted code submissions.
 * Blocks dangerous syscalls, process-spawning, file-system tampering, and network calls.
 */

export interface SecurityScanResult {
  isSafe: boolean;
  reason?: string;
  category?: 'MALICIOUS_PROCESS' | 'FILESYSTEM_ACCESS' | 'NETWORK_CALL' | 'SYSTEM_CALL';
}

export class CodeSecurityScanner {
  /**
   * Scan code submission before passing to compilation or execution engine
   */
  public static scan(language: string, code: string): SecurityScanResult {
    if (!code || typeof code !== 'string') {
      return { isSafe: true };
    }

    const lang = language.toLowerCase();
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // strip comments for C-style

    // 1. PYTHON SECURITY CHECKS
    if (lang === 'python' || lang === 'py' || lang === 'python3') {
      const pyNoComments = code.replace(/#.*/g, '');

      // Check dangerous imports
      const dangerousPyImports = [
        /\bimport\s+(os|subprocess|shutil|socket|urllib|requests|pty|ctypes|webbrowser|multiprocessing)\b/i,
        /\bfrom\s+(os|subprocess|shutil|socket|urllib|requests|pty|ctypes|webbrowser|multiprocessing)\b/i,
      ];

      for (const pattern of dangerousPyImports) {
        if (pattern.test(pyNoComments)) {
          return {
            isSafe: false,
            category: 'MALICIOUS_PROCESS',
            reason: 'Security violation: Import of system, process or network modules is prohibited.',
          };
        }
      }

      // Check dangerous built-in execution
      const dangerousPyCalls = [
        /\b(os\.system|subprocess\.\w+|shutil\.\w+)\b/i,
        /\b(__import__|compile|breakpoint)\s*\(/i,
        /\bopen\s*\([^)]*['"][wWaA+]/i, // file write/append
        /\b(eval|exec)\s*\(/i,
      ];

      for (const pattern of dangerousPyCalls) {
        if (pattern.test(pyNoComments)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: Dynamic evaluation, filesystem write, or system execution detected.',
          };
        }
      }
    }

    // 2. C / C++ SECURITY CHECKS
    else if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
      const dangerousCppHeaders = [
        /#\s*include\s*[<"](windows\.h|unistd\.h|sys\/|winsock2\.h|direct\.h|process\.h)[>"]/i,
      ];

      for (const pattern of dangerousCppHeaders) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: Inclusion of OS-level or network headers is prohibited in sandbox.',
          };
        }
      }

      const dangerousCppCalls = [
        /\b(system|popen|fork|vfork|exec|execl|execv|remove|unlink|rmdir|CreateProcess|kill)\s*\(/i,
        /\b(socket|connect|bind|listen|accept)\s*\(/i,
      ];

      for (const pattern of dangerousCppCalls) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'MALICIOUS_PROCESS',
            reason: 'Security violation: Process creation, termination, or network operations are prohibited.',
          };
        }
      }
    }

    // 3. JAVA SECURITY CHECKS
    else if (lang === 'java') {
      const dangerousJavaCalls = [
        /\bRuntime\s*\.\s*getRuntime\s*\(\s*\)/i,
        /\bProcessBuilder\b/i,
        /\bSystem\s*\.\s*exit\s*\(/i,
        /\b(FileOutputStream|FileWriter|RandomAccessFile)\b/i,
        /\b(Socket|ServerSocket|DatagramSocket)\b/i,
        /\bjava\s*\.\s*lang\s*\.\s*reflect\b/i,
      ];

      for (const pattern of dangerousJavaCalls) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: Java Runtime execution, process spawn, or socket operations are prohibited.',
          };
        }
      }
    }

    // 4. JAVASCRIPT / TYPESCRIPT SECURITY CHECKS
    else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
      const dangerousJsCalls = [
        /\bchild_process\b/i,
        /\brequire\s*\(\s*['"](fs|child_process|net|http|https|dgram|cluster)['"]\s*\)/i,
        /\bimport\s+.*from\s+['"](fs|child_process|net|http|https)['"]/i,
        /\bprocess\s*\.\s*(exit|kill|abort)\s*\(/i,
      ];

      for (const pattern of dangerousJsCalls) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'MALICIOUS_PROCESS',
            reason: 'Security violation: Access to Node.js process, filesystem, or network internals is prohibited.',
          };
        }
      }
    }

    // 5. C# SECURITY CHECKS
    else if (lang === 'csharp' || lang === 'cs' || lang === 'c#') {
      const dangerousCsCalls = [
        /\bProcess\s*\.\s*Start\b/i,
        /\b(File|Directory)\s*\.\s*(Delete|CreateDirectory)\b/i,
        /\bSystem\s*\.\s*Net\s*\.\s*Sockets\b/i,
        /\bDllImport\b/i,
      ];

      for (const pattern of dangerousCsCalls) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: C# process start, socket, or P/Invoke operations are prohibited.',
          };
        }
      }
    }

    // 6. GO SECURITY CHECKS
    else if (lang === 'go' || lang === 'golang') {
      const dangerousGoImports = [
        /["'](os\/exec|net|syscall|plugin)["']/i,
      ];

      for (const pattern of dangerousGoImports) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'MALICIOUS_PROCESS',
            reason: 'Security violation: Go os/exec, net, or syscall packages are prohibited.',
          };
        }
      }
    }

    // 7. PHP SECURITY CHECKS
    else if (lang === 'php') {
      const dangerousPhpCalls = [
        /\b(exec|system|passthru|shell_exec|proc_open|popen|pcntl_exec)\s*\(/i,
        /`[^`]*`/,
        /\b(file_put_contents|unlink|rmdir|copy)\s*\(/i,
      ];

      for (const pattern of dangerousPhpCalls) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: PHP shell execution or file manipulation is prohibited.',
          };
        }
      }
    }

    // 8. RUBY SECURITY CHECKS
    else if (lang === 'ruby' || lang === 'rb') {
      const dangerousRubyCalls = [
        /\b(system|exec|spawn|fork)\b/i,
        /`[^`]*`/,
        /\b(Open3|IO\.popen|File\.delete)\b/i,
      ];

      for (const pattern of dangerousRubyCalls) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: Ruby process execution or shell backticks are prohibited.',
          };
        }
      }
    }

    // 9. RUST SECURITY CHECKS
    else if (lang === 'rust' || lang === 'rs') {
      const dangerousRustPatterns = [
        /\bstd::process::Command\b/i,
        /\bstd::net\b/i,
        /\bstd::fs::remove_file\b/i,
      ];

      for (const pattern of dangerousRustPatterns) {
        if (pattern.test(cleanCode)) {
          return {
            isSafe: false,
            category: 'SYSTEM_CALL',
            reason: 'Security violation: Rust std::process::Command or network operations are prohibited.',
          };
        }
      }
    }

    return { isSafe: true };
  }
}
