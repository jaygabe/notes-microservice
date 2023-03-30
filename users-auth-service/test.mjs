import { default as jsyaml } from 'js-yaml';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * STORE THESE IN ANOTHER FILE FOR MAINTAINABILITY
 */

import fs from 'fs';
import path from 'path';

console.log(path.resolve(__dirname, process.env.SEQUELIZE_CONNECT));
const filePath = path.resolve(__dirname, process.env.SEQUELIZE_CONNECT.trim());
// fs.stat(
//   path.resolve(__dirname, process.env.SEQUELIZE_CONNECT),
//   (err, stats) => {
//     if (err) {
//       console.error('ERROR: ', err);
//       return;
//     }

//     console.log('File permissions:', stats.mode.toString(8));
//   }
// );

const loadYaml = async () => {
  const yamltext = fs.readFileSync(
    path.resolve(__dirname, process.env.SEQUELIZE_CONNECT.trim()),
    'utf8'
  );

  const params = await jsyaml.load(yamltext, 'utf8');

  console.log(params);
};

loadYaml();

// Set the permissions of the file to read and write for the owner and group, and read-only for others
fs.chmod(filePath, 0o664, (err) => {
  if (err) {
    console.log(err);
    console.error('Error changing file permissions');
    return;
  }

  console.log('File permissions changed successfully');
});

// Check if the file is readable
fs.access(filePath, fs.constants.R_OK, (err) => {
  if (err) {
    console.error('File is not readable');
    return;
  }

  console.log('File is readable');
});

// Check if the file is writable
fs.access(filePath, fs.constants.W_OK, (err) => {
  if (err) {
    console.error('File is not writable');
    return;
  }

  console.log('File is writable');
});

// Check if the file is executable
fs.access(filePath, fs.constants.X_OK, (err) => {
  if (err) {
    console.error('File is not executable');
    return;
  }

  console.log('File is executable');
});
