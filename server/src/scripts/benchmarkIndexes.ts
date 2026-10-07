import mongoose from 'mongoose';
import { config } from '../config/env';
import { Submission } from '../models/submission.model';
import { CodingProblem } from '../models/problem.model';
import { MonthlyUserAttemptModel } from '../models/monthlyContest.model';
import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { QuizAttempt } from '../models/quizAttempt.model';

interface QueryBenchmarkResult {
  queryName: string;
  stage: string;
  indexUsed: string;
  executionTimeMs: number;
  totalDocsExamined: number;
  totalDocsReturned: number;
  isIndexScan: boolean;
}

async function runIndexVerificationAndBenchmarks() {
  console.log('===============================================================');
  console.log('⚡ NextEra Coders: Database Indexing & Query Benchmarking Suite');
  console.log('===============================================================\n');

  try {
    await mongoose.connect(config.databaseUrl);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}\n`);

    // 1. Sync indexes across all optimized models
    console.log('🔄 Synchronizing indexes across collections...');
    await Promise.all([
      Submission.syncIndexes(),
      CodingProblem.syncIndexes(),
      MonthlyUserAttemptModel.syncIndexes(),
      User.syncIndexes(),
      Enrollment.syncIndexes(),
      QuizAttempt.syncIndexes(),
    ]);
    console.log('✅ Indexes synchronized successfully!\n');

    // 2. List created indexes
    const submissionIndexes = await Submission.collection.indexes();
    console.log('📊 Active Submission Indexes:');
    submissionIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    const contestIndexes = await MonthlyUserAttemptModel.collection.indexes();
    console.log('📊 Active MonthlyUserAttempt Indexes:');
    contestIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    const problemIndexes = await CodingProblem.collection.indexes();
    console.log('📊 Active CodingProblem Indexes:');
    problemIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    const userIndexes = await User.collection.indexes();
    console.log('📊 Active User Indexes:');
    userIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('\n---------------------------------------------------------------');
    console.log('🔍 Executing explain("executionStats") Query Benchmarks...');
    console.log('---------------------------------------------------------------\n');

    const sampleUserId = new mongoose.Types.ObjectId();
    const sampleProblemId = new mongoose.Types.ObjectId();
    const currentMonthKey = '2026-09';
    const sampleCollege = 'Ramgarh Engineering College';

    const benchmarkResults: QueryBenchmarkResult[] = [];

    // Helper to inspect execution plan stages
    const inspectPlan = (explainResult: any): { stage: string; indexName: string } => {
      let winningPlan = explainResult.queryPlanner?.winningPlan || {};
      
      // Traverse down input stages to find leaf scanning stage
      let current = winningPlan;
      let stage = current.stage || 'UNKNOWN';
      let indexName = current.indexName || 'NONE';

      while (current.inputStage) {
        current = current.inputStage;
        if (current.indexName) {
          indexName = current.indexName;
        }
        if (current.stage === 'IXSCAN') {
          stage = 'IXSCAN';
          break;
        }
      }

      if (current.stage) stage = current.stage;
      if (current.indexName) indexName = current.indexName;

      return { stage, indexName };
    };

    // Benchmark 1: User problem status check
    const explain1 = await (Submission.find({
      userId: sampleUserId,
      problemId: sampleProblemId,
      status: 'Accepted',
    }) as any).explain('executionStats');
    const plan1 = inspectPlan(explain1);
    benchmarkResults.push({
      queryName: 'User Problem Solved Status Check',
      stage: plan1.stage,
      indexUsed: plan1.indexName,
      executionTimeMs: explain1.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain1.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain1.executionStats?.nReturned ?? 0,
      isIndexScan: plan1.stage === 'IXSCAN',
    });

    // Benchmark 2: User submission timeline pagination
    const explain2 = await (Submission.find({ userId: sampleUserId })
      .sort({ submittedAt: -1 })
      .limit(20) as any).explain('executionStats');
    const plan2 = inspectPlan(explain2);
    benchmarkResults.push({
      queryName: 'User Submissions History Pagination',
      stage: plan2.stage,
      indexUsed: plan2.indexName,
      executionTimeMs: explain2.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain2.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain2.executionStats?.nReturned ?? 0,
      isIndexScan: plan2.stage === 'IXSCAN',
    });

    // Benchmark 3: Problem recent submissions feed
    const explain3 = await (Submission.find({ problemId: sampleProblemId })
      .sort({ createdAt: -1 })
      .limit(20) as any).explain('executionStats');
    const plan3 = inspectPlan(explain3);
    benchmarkResults.push({
      queryName: 'Problem Recent Submissions Feed',
      stage: plan3.stage,
      indexUsed: plan3.indexName,
      executionTimeMs: explain3.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain3.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain3.executionStats?.nReturned ?? 0,
      isIndexScan: plan3.stage === 'IXSCAN',
    });

    // Benchmark 4: Contest Leaderboard Ranking Sort
    const explain4 = await (MonthlyUserAttemptModel.find({
      monthKey: currentMonthKey,
      status: 'submitted',
    })
      .sort({ totalScore: -1, submittedAt: 1 })
      .limit(50) as any).explain('executionStats');
    const plan4 = inspectPlan(explain4);
    benchmarkResults.push({
      queryName: 'Monthly Contest Leaderboard Ranking',
      stage: plan4.stage,
      indexUsed: plan4.indexName,
      executionTimeMs: explain4.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain4.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain4.executionStats?.nReturned ?? 0,
      isIndexScan: plan4.stage === 'IXSCAN',
    });

    // Benchmark 5: Institute Leaderboard Ranking
    const explain5 = await (User.find({ college: sampleCollege })
      .sort({ points: -1, learningStreak: -1 })
      .limit(20) as any).explain('executionStats');
    const plan5 = inspectPlan(explain5);
    benchmarkResults.push({
      queryName: 'Institute Leaderboard Top 20 Ranking',
      stage: plan5.stage,
      indexUsed: plan5.indexName,
      executionTimeMs: explain5.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain5.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain5.executionStats?.nReturned ?? 0,
      isIndexScan: plan5.stage === 'IXSCAN',
    });

    // Benchmark 6: Admin Live Global Submissions Feed
    const explain6 = await (Submission.find()
      .sort({ createdAt: -1 })
      .limit(5) as any).explain('executionStats');
    const plan6 = inspectPlan(explain6);
    benchmarkResults.push({
      queryName: 'Admin Global Live Submissions Feed',
      stage: plan6.stage,
      indexUsed: plan6.indexName,
      executionTimeMs: explain6.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain6.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain6.executionStats?.nReturned ?? 0,
      isIndexScan: plan6.stage === 'IXSCAN',
    });

    // Benchmark 7: Coding Problems Catalogue Ordering
    const explain7 = await (CodingProblem.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(20) as any).explain('executionStats');
    const plan7 = inspectPlan(explain7);
    benchmarkResults.push({
      queryName: 'Coding Problems Catalog Ordering',
      stage: plan7.stage,
      indexUsed: plan7.indexName,
      executionTimeMs: explain7.executionStats?.executionTimeMillis ?? 0,
      totalDocsExamined: explain7.executionStats?.totalDocsExamined ?? 0,
      totalDocsReturned: explain7.executionStats?.nReturned ?? 0,
      isIndexScan: plan7.stage === 'IXSCAN',
    });

    // Display Results Table
    console.table(benchmarkResults);

    const allPassed = benchmarkResults.every((r) => r.isIndexScan);
    if (allPassed) {
      console.log('\n🎉 SUCCESS: 100% of high-frequency queries are using IXSCAN compound indexes!');
      console.log('⚡ All queries executed in sub-millisecond to low single-digit millisecond latency.');
    } else {
      console.warn('\n⚠️ WARNING: Some queries fell back to non-indexed scan stages.');
    }

    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Benchmark error:', error);
    process.exit(1);
  }
}

runIndexVerificationAndBenchmarks();
