import { Note, AbstractNotesStore } from './Notes.mjs';
import mongodb from 'mongodb';
const MongoClient = mongodb.MongoClient;
import DBG from 'debug';
const debug = DBG('notes:notes-mongodb');
const error = DBG('notes:error-mongodb');

let client;

const connectDB = async () => {
  if (!client) {
    try {
      client = await MongoClient.connect(process.env.MONGO_URL);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to MongoDB!', err);
    }
  }
};

const db = () => {
  console.log('Getting MongoDB database');
  return client.db(process.env.MONGODB_NAME);
};

export default class MongoDBNotesStore extends AbstractNotesStore {
  async close() {
    if (client) client.close();
    client = undefined;
  }

  async update(key, title, body) {
    await connectDB();
    const note = new Note(key, title, body);
    const collection = db().collection('notes');
    await collection.updateOne(
      { notekey: key },
      { $set: { title: title, body: body } }
    );
    return note;
  }

  async create(key, title, body) {
    await connectDB();
    const note = new Note(key, title, body);
    const collection = db().collection('notes');
    await collection.insertOne({
      notekey: key,
      title: title,
      body: body,
    });
    return note;
  }

  async read(key) {
    await connectDB();
    const collection = db().collection('notes');
    const doc = await collection.findOne({ notekey: key });
    const note = new Note(doc.notekey, doc.title, doc.body);
    return note;
  }

  async destroy(key) {
    await connectDB();
    const collection = db().collection('notes');
    const doc = await collection.findOne({ notekey: key });
    if (!doc) {
      throw new Error(`No note found for ${key}`);
    } else {
      await collection.findOneAndDelete({ notekey: key });
    }
  }

  async keylist() {
    try {
      await connectDB();
      const collection = db().collection('notes');

      const cursor = collection.find({});
      const keyz = [];

      await cursor.forEach((note) => {
        keyz.push(note.notekey);
      });

      console.log(keyz);
      return keyz;
    } catch (err) {
      console.error('Error fetching note keys: ', err);
      throw err;
    }
  }

  async count() {
    await connectDB();
    const collection = db().collection('notes');
    const count = await collection.count({});
    return count;
  }
}
