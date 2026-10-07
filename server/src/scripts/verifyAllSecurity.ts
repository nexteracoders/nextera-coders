import { CodeSecurityScanner } from '../services/codeExecution/codeSecurityScanner';

console.log('=== TEST 1: Security Scanner malicious code detection ===');

const maliciousSamples = [
  { lang: 'python', code: 'import os\nos.system("rm -rf /")' },
  { lang: 'python', code: 'import subprocess\nsubprocess.Popen(["calc.exe"])' },
  { lang: 'python', code: 'eval("__import__(\'os\').system(\'dir\')")' },
  { lang: 'python', code: 'open("C:\\\\Windows\\\\System32\\\\drivers\\\\etc\\\\hosts", "w")' },
  { lang: 'cpp', code: '#include <windows.h>\nint main() { system("notepad"); return 0; }' },
  { lang: 'cpp', code: '#include <iostream>\nint main() { system("dir"); return 0; }' },
  { lang: 'c', code: '#include <stdio.h>\nint main() { popen("whoami", "r"); return 0; }' },
  { lang: 'java', code: 'class Solution { public void run() { Runtime.getRuntime().exec("calc"); } }' },
  { lang: 'javascript', code: 'const cp = require("child_process"); cp.execSync("whoami");' },
];

let allMaliciousBlocked = true;
for (const sample of maliciousSamples) {
  const result = CodeSecurityScanner.scan(sample.lang, sample.code);
  if (result.isSafe) {
    console.error(`FAILED: ${sample.lang} malicious code was NOT blocked!`);
    allMaliciousBlocked = false;
  } else {
    console.log(`[BLOCKED] ${sample.lang}: ${result.reason} (${result.category})`);
  }
}

console.log('\n=== TEST 2: Legitimate DSA code validation ===');

const validSamples = [
  {
    lang: 'python',
    code: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`,
  },
  {
    lang: 'cpp',
    code: `#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (mp.count(comp)) return {mp[comp], i};
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
  },
  {
    lang: 'c',
    code: `#include <stdio.h>
#include <stdlib.h>
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* res = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; ++i) {
        for (int j = i + 1; j < numsSize; ++j) {
            if (nums[i] + nums[j] == target) {
                res[0] = i; res[1] = j; return res;
            }
        }
    }
    return res;
}`,
  },
  {
    lang: 'java',
    code: `import java.util.HashMap;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
  },
  {
    lang: 'javascript',
    code: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
    }
    return [];
}`,
  },
];

let allValidAllowed = true;
for (const sample of validSamples) {
  const result = CodeSecurityScanner.scan(sample.lang, sample.code);
  if (!result.isSafe) {
    console.error(`FAILED: ${sample.lang} legitimate code was falsely flagged! Reason: ${result.reason}`);
    allValidAllowed = false;
  } else {
    console.log(`[ALLOWED] ${sample.lang}: passed scanner cleanly`);
  }
}

console.log('\n=== SUMMARY ===');
if (allMaliciousBlocked && allValidAllowed) {
  console.log('SUCCESS: All security scanner tests passed successfully! System is protected.');
  process.exit(0);
} else {
  console.error('FAILURE: Security scanner test failed!');
  process.exit(1);
}
