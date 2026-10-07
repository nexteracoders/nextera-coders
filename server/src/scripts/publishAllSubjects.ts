import mongoose from 'mongoose';
import { TutorialSubject } from '../models/tutorialSubject.model';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/nextera_coders_dev');
  const res = await TutorialSubject.updateMany({}, { $set: { isPublished: true } });
  console.log(`Updated ${res.modifiedCount} subjects to isPublished: true`);
  const total = await TutorialSubject.countDocuments({ isPublished: true });
  console.log(`Total published subjects now: ${total}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
