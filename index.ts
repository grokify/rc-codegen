import * as commander from 'commander';
import * as _ from 'lodash';
import * as fs from 'fs';

// ask user to enter languange and output
const languages = ['csharp', 'go', 'ruby', 'swift', 'typescript'];
commander.version(require('./package.json').version)
  .option('-l, --language <language>', 'programming languages: ' + languages.join(', '))
  .option('-o, --output <output>', 'output directory')
  .option('-t, --templates <templates>', 'templates directory')
  .option('-c, --configuration [configuration]', 'configuration file')
  .parse(process.argv);

const language = commander['language'];
const output = commander['output'];
const templates = commander['templates'];
const configuration = commander['configuration'];

if (!language || !output || !templates
  || !_.includes(languages, language)
  || !fs.lstatSync(output).isDirectory()
  || !fs.lstatSync(templates).isDirectory()) {
  commander.help();
}

// do language specific codegen
console.log(`./${language}/index`);
require(`./${language}/index`).generate(output, templates, configuration);
