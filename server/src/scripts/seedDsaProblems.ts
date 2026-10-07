import dotenv from 'dotenv';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db';
import { CodingProblem } from '../models/problem.model';
import { dsaProblemsData } from '../data/dsaProblems.data';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function seedDsaProblems() {
  logger.info('==========================================');
  logger.info('Starting DSA Problems Seeding & Deduplication...');
  logger.info('==========================================');

  const connected = await connectDB();
  if (!connected) {
    logger.error('Database connection failed. Aborting DSA seeding.');
    process.exit(1);
  }

  try {
    let createdCount = 0;
    let updatedCount = 0;

    // Deduplicate in memory first by slug
    const uniqueProblemsMap = new Map<string, typeof dsaProblemsData[0]>();
    for (const prob of dsaProblemsData) {
      if (!uniqueProblemsMap.has(prob.slug)) {
        uniqueProblemsMap.set(prob.slug, prob);
      } else {
        logger.warn(`Duplicate problem slug detected and skipped in memory: ${prob.slug}`);
      }
    }

    const uniqueProblems = Array.from(uniqueProblemsMap.values());
    logger.info(`Total unique DSA problems to upsert: ${uniqueProblems.length}`);

    for (const prob of uniqueProblems) {
      const existing = await CodingProblem.findOne({ slug: prob.slug });
      if (!existing) {
        await CodingProblem.create(prob);
        createdCount++;
        logger.info(`[Created] ${prob.title} (${prob.category} - ${prob.difficulty})`);
      } else {
        await CodingProblem.updateOne(
          { slug: prob.slug },
          {
            $set: {
              title: prob.title,
              category: prob.category,
              difficulty: prob.difficulty,
              description: prob.description,
              constraints: prob.constraints,
              examples: prob.examples,
              hints: prob.hints,
              testCases: prob.testCases,
              starterCode: prob.starterCode,
              expectedComplexity: prob.expectedComplexity,
              solution: prob.solution,
              isPublished: prob.isPublished,
              order: prob.order,
            },
          }
        );
        updatedCount++;
        logger.info(`[Updated] ${prob.title} (${prob.category} - ${prob.difficulty})`);
      }
    }

    logger.info('==========================================');
    logger.info(`DSA Seeding Complete! Created: ${createdCount}, Updated: ${updatedCount}, Total: ${uniqueProblems.length}`);
    logger.info('==========================================');
  } catch (error) {
    logger.error(`Error during DSA seeding: ${(error as Error).message}`);
    throw error;
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  seedDsaProblems()
    .then(() => {
      logger.info('DSA Seed process finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(`DSA Seed process failed: ${err.message}`);
      process.exit(1);
    });
}
