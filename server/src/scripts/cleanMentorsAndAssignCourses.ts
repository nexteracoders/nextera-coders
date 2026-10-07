import dotenv from 'dotenv';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db';
import { Mentor } from '../models/mentor.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SANDIP_INSTRUCTOR = {
  name: 'Sandip Kr Verma',
  role: 'Founder & Principal Engineering Mentor',
  bio: 'Founder of NextEra Coders. Specializes in advanced Data Structures & Algorithms, High-Throughput Distributed Systems, and full-stack production architecture. Has mentored over 100,000 engineers to land top-tier tech roles.',
};

const NAVEEN_INSTRUCTOR = {
  name: 'Naveen Kumar',
  role: 'Co-Founder & Technical Architect',
  bio: 'Co-Founder & Technical Architect at NextEra Coders. Expert in backend infrastructure, cloud-native deployments, low-level design patterns, and algorithmic problem-solving.',
};

export async function cleanMentorsAndAssignCourses() {
  logger.info('======================================================');
  logger.info('Starting Mentor Cleanup & Course Instructor Migration');
  logger.info('======================================================');

  const connected = await connectDB();
  if (!connected) {
    logger.error('Database connection failed. Aborting.');
    process.exit(1);
  }

  try {
    // 1. Fetch all existing mentors
    const allMentors = await Mentor.find({});
    logger.info(`Found ${allMentors.length} total mentors in database.`);

    for (const mentor of allMentors) {
      const lowerName = mentor.name.toLowerCase();
      const isSandip = lowerName.includes('sandip') || lowerName.includes('lakshay');
      const isNaveen = lowerName.includes('naveen') || lowerName.includes('shanti');

      if (!isSandip && !isNaveen) {
        logger.info(`[DELETE DUMMY MENTOR] Removing: ${mentor.name} (${mentor._id})`);
        await Mentor.findByIdAndDelete(mentor._id);
        // Also if linked to a user, clean up
        if (mentor.userId) {
          await User.findByIdAndUpdate(mentor.userId, { mentorProfileId: null });
        }
      } else if (isSandip) {
        // Standardize Sandip's profile
        mentor.name = 'Sandip Kr Verma';
        mentor.role = 'Founder & Principal Engineering Mentor';
        mentor.signature = 'Sandip Kr Verma';
        mentor.image = '/images/sandip_verma.jpg';
        mentor.isPublished = true;
        mentor.order = 1;
        mentor.bio = SANDIP_INSTRUCTOR.bio;
        await mentor.save();
        logger.info(`[STANDARDIZED] Sandip Kr Verma profile updated.`);
      } else if (isNaveen) {
        // Standardize Naveen's profile
        mentor.name = 'Naveen Kumar';
        mentor.role = 'Co-Founder & Technical Architect';
        mentor.signature = 'Naveen Kumar';
        mentor.image = '/images/naveen_kumar.jpg';
        mentor.isPublished = true;
        mentor.order = 2;
        mentor.bio = NAVEEN_INSTRUCTOR.bio;
        await mentor.save();
        logger.info(`[STANDARDIZED] Naveen Kumar profile updated.`);
      }
    }

    // Ensure Sandip and Naveen definitely exist in Mentor collection
    const sandipExists = await Mentor.findOne({ name: 'Sandip Kr Verma' });
    if (!sandipExists) {
      await Mentor.create({
        name: 'Sandip Kr Verma',
        role: 'Founder & Principal Engineering Mentor',
        exCompanies: ['NextEra Coders', 'Tech Forward'],
        image: '/images/sandip_verma.jpg',
        quoteTitle: 'Transforming Learners into Industry Leaders.',
        quoteBody:
          'From startups to tech giants, "We bridge the gap between learning and doing". Through real-world challenges, personalized mentorship, and a thriving community, we empower developers to ship products that matter. Excellence is the only standard.',
        signature: 'Sandip Kr Verma',
        experience: 'Tech Lead & Mentor',
        studentsMentored: '100k+ Learners',
        placements: '500+ Tier-1 Offers',
        rating: '4.98 / 5.0',
        email: 'sandip@nexteracoders.com',
        bio: SANDIP_INSTRUCTOR.bio,
        skills: ['Data Structures & Algorithms', 'System Design', 'React & Node.js', 'Distributed Systems', 'TypeScript', 'Competitive Programming'],
        isPublished: true,
        order: 1,
      });
      logger.info(`[CREATED] Sandip Kr Verma mentor record created.`);
    }

    const naveenExists = await Mentor.findOne({ name: 'Naveen Kumar' });
    if (!naveenExists) {
      await Mentor.create({
        name: 'Naveen Kumar',
        role: 'Co-Founder & Technical Architect',
        exCompanies: ['NextEra Coders', 'Tech Forward'],
        image: '/images/naveen_kumar.jpg',
        quoteTitle: 'From Syntax Confusion to High-Scale Mastery.',
        quoteBody:
          'True engineering maturity comes from solving hard algorithmic problems and designing resilient distributed backends. We break down complex computer science concepts into clear, memorable mental models that last a lifetime.',
        signature: 'Naveen Kumar',
        experience: 'Systems Architect',
        studentsMentored: '80k+ Engineers',
        placements: 'Top Tech Offers',
        rating: '4.95 / 5.0',
        email: 'naveen@nexteracoders.com',
        bio: NAVEEN_INSTRUCTOR.bio,
        skills: ['Backend Architecture', 'Go & Python', 'Database Optimization', 'Kubernetes & Docker', 'DSA Patterns'],
        isPublished: true,
        order: 2,
      });
      logger.info(`[CREATED] Naveen Kumar mentor record created.`);
    }

    // 2. Process all courses in the database
    const allCourses = await Course.find({});
    logger.info(`Found ${allCourses.length} courses in database.`);

    let updatedCoursesCount = 0;
    const sandipCourseTitles: string[] = [];
    const naveenCourseTitles: string[] = [];

    for (const course of allCourses) {
      const titleLower = (course.title || '').toLowerCase();
      const catLower = (course.category || '').toLowerCase();
      const currentInstName = (course.instructor?.name || '').toLowerCase();

      // Determine appropriate instructor
      const isBackendOrCloudOrPython =
        titleLower.includes('backend') ||
        titleLower.includes('spring') ||
        titleLower.includes('java') ||
        titleLower.includes('python') ||
        titleLower.includes('devops') ||
        titleLower.includes('docker') ||
        titleLower.includes('kubernetes') ||
        titleLower.includes('cloud') ||
        titleLower.includes('cyber') ||
        titleLower.includes('hacking') ||
        titleLower.includes('ai') ||
        titleLower.includes('genai') ||
        titleLower.includes('microservices') ||
        catLower.includes('python') ||
        catLower.includes('java');

      // If current instructor is already Naveen Kumar or Sandip Kr Verma, retain or format
      let assignedInstructor;
      if (currentInstName.includes('naveen')) {
        assignedInstructor = NAVEEN_INSTRUCTOR;
        naveenCourseTitles.push(course.title);
      } else if (currentInstName.includes('sandip')) {
        assignedInstructor = SANDIP_INSTRUCTOR;
        sandipCourseTitles.push(course.title);
      } else if (isBackendOrCloudOrPython) {
        assignedInstructor = NAVEEN_INSTRUCTOR;
        naveenCourseTitles.push(course.title);
      } else {
        assignedInstructor = SANDIP_INSTRUCTOR;
        sandipCourseTitles.push(course.title);
      }

      course.instructor = {
        name: assignedInstructor.name,
        role: assignedInstructor.role,
        bio: assignedInstructor.bio,
      };

      await course.save();
      updatedCoursesCount++;
      logger.info(`[COURSE UPDATED] "${course.title}" -> Instructor: ${assignedInstructor.name}`);
    }

    // 3. Update courses list on Mentors
    await Mentor.findOneAndUpdate(
      { name: 'Sandip Kr Verma' },
      { $set: { courses: sandipCourseTitles } }
    );
    await Mentor.findOneAndUpdate(
      { name: 'Naveen Kumar' },
      { $set: { courses: naveenCourseTitles } }
    );

    logger.info('======================================================');
    logger.info(`SUCCESS: Updated ${updatedCoursesCount} courses.`);
    logger.info(`Sandip Kr Verma courses: ${sandipCourseTitles.length}`);
    logger.info(`Naveen Kumar courses: ${naveenCourseTitles.length}`);
    logger.info('Mentor collection pruned to only Sandip Kr Verma and Naveen Kumar.');
    logger.info('======================================================');
  } catch (error) {
    logger.error('Error during cleanup:', error);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  cleanMentorsAndAssignCourses()
    .then(() => {
      logger.info('Done.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Fatal error:', err);
      process.exit(1);
    });
}
