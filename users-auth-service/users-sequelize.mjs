import Sequelize from 'sequelize';
import { default as jsyaml } from 'js-yaml';
import { promises as fs } from 'fs';
import * as util from 'util';
import path from 'path';
import DBG from 'debug';
const log = DBG('users:model-users');
const error = DBG('users:error');

var sequlz;

export class SQUser extends Sequelize.Model {}

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function connectDB() {
  if (sequlz) return sequlz;

  const yamltext = await fs.readFile(
    path.resolve(__dirname, process.env.SEQUELIZE_CONNECT.trim()),
    'utf8'
  );

  const params = await jsyaml.load(yamltext, 'utf8');

  if (
    typeof process.env.SEQUELIZE_DBNAME !== 'undefined' &&
    process.env.SEQUELIZE_DBNAME !== ''
  ) {
    params.dbname = process.env.SEQUELIZE_DBNAME;
  }

  if (
    typeof process.env.SEQUELIZE_DBUSER !== 'undefined' &&
    process.env.SEQUELIZE_DBUSER !== ''
  ) {
    params.username = process.env.SEQUELIZE_DBUSER;
  }

  if (
    typeof process.env.SEQUELIZE_DBPASSWD !== 'undefined' &&
    process.env.SEQUELIZE_DBPASSWD !== ''
  ) {
    params.passwd = process.env.SEQUELIZE_DBPASSWD;
  }

  if (
    typeof process.env.SEQUELIZE_DBHOST !== 'undefined' &&
    process.env.SEQUELIZE_DBHOST !== ''
  ) {
    params.params.host = process.env.SEQUELIZE_DBHOST;
  }

  if (
    typeof process.env.SEQUELIZE_DBPORT !== 'undefined' &&
    process.env.SEQUELIZE_DBPORT !== ''
  ) {
    params.params.port = process.env.SEQUELIZE_DBPORT;
  }

  if (
    typeof process.env.SEQUELIZE_DBDIALECT !== 'undefined' &&
    process.env.SEQUELIZE_DBDIALECT !== ''
  ) {
    params.params.dialect = process.env.SEQUELIZE_DBDIALECT;
  }

  log('Sequelize params ' + util.inspect(params));

  sequlz = new Sequelize(
    params.dbname,
    params.username,
    params.password,
    params.params
  );

  SQUser.init(
    {
      username: { type: Sequelize.STRING, unique: true },
      password: Sequelize.STRING,
      provider: Sequelize.STRING,
      familyName: Sequelize.STRING,
      givenName: Sequelize.STRING,
      middleName: Sequelize.STRING,
      emails: Sequelize.STRING(2048),
      photos: Sequelize.STRING(2048),
    },
    {
      sequelize: sequlz,
      modelName: 'SQUser',
    }
  );

  await SQUser.sync();
}

export function userParams(req) {
  return {
    username: req.params.username,
    password: req.params.password,
    provider: req.params.provider,
    familyName: req.params.familyName,
    givenName: req.params.givenName,
    middleName: req.params.middleName,
    emails: JSON.stringify(req.params.emails),
    photos: JSON.stringify(req.params.photos),
  };
}

export function sanitizedUser(user) {
  var ret = {
    id: user.username,
    username: user.username,
    provider: user.provider,
    familyName: user.familyName,
    givenName: user.givenName,
    middleName: user.middleName,
  };

  try {
    ret.emails = JSON.parse(user.emails);
  } catch (err) {
    ret.emails = [];
  }

  try {
    ret.photos = JSON.parse(user.photos);
  } catch (err) {
    ret.photos = [];
  }

  return ret;
}

export async function findOneUser(username) {
  let user = await SQUser.findOne({ where: { username: username } });
  user = user ? sanitizedUser(user) : undefined;
  return user;
}

export async function createUser(req) {
  let tocreate = userParams(req);
  await SQUser.create(tocreate);
  const result = await findOneUser(req.params.username);
  return result;
}
