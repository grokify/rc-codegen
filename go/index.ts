import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import * as _ from 'lodash';
import { swagger, segments, actions, segmentIds, children } from '../common/swagger';
import { format_code, PascalCase } from '../common/util';

console.log(`GO_START`);
// template engine
let engine = null
const initEngine = (templates) => {
  engine = nunjucks.configure(templates, {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
  });
  engine.addFilter('http_method', http_method);
}
const http_method = (str: string): string => {
  if (str == 'list') {
    return 'get';
  }
  if (_.includes(['get', 'post', 'put', 'delete'], str)) {
    return str;
  }
  throw new RangeError(`Unknown http method: "${str}"`);
}


// convert swagger type to GO type
const get_type = (type, format, ref, items) => {
  if (!type) {
    return _.last<string>(ref.split('/')).replace(/\./g, '_');
  }
  if (type === 'string') {
    if (format === 'binary') {
      return '[]byte';
    }
    return 'string';
  }
  if (type === 'boolean') {
    return 'bool';
  }
  if (type === 'integer') {
    return 'int';
  }
  if (type === 'array') {
    let type = _.last<string>((items.type || items.$ref).split('/')).replace(/\./g, '_');
    if (type !== 'string') {
      type = _.upperFirst(type);
    }
    return type + '[]interface{}';
  }
  throw new RangeError(`Unknown field type: "${type}"`);
}


// convert swagger definitions to nunjucks definitions
const generate_definitions = (definitions) => {
  return Object.keys(definitions).map((key) => {
    const name = key.replace(/\./g, '_');
    const properties = definitions[key].properties;
    const fields = Object.keys(properties).map((name) => {
      const { type, format, description, $ref, items } = properties[name];
      return { name, type: get_type(type, format, $ref, items), description };
    });
    return { name, fields };
  });
}


// render Definitions Go files
const render_definitions = (output: string) => {
  const definitions = generate_definitions(swagger.definitions);
  for (const definition of definitions) {
    definition['with_namespace'] = true;
    const code = engine.render('Definition.njk', { definition });
    console.log(path.join(output, 'Definitions', `${definition.name}.go`))
    console.log(`RENDER_GO`);
    fs.writeFileSync(path.join(output, 'Definitions', `${definition.name}.go`), format_code(code));
  }
}


// render Paths Go files
const render_paths = (output: string) => {
  for (const segment of segments) {
    const className = PascalCase(segment);
    const methods = (actions.get(segment) || []).map((method) => {
      method.definitions = generate_definitions(method.definitions);
      return method;
    });
    const myChildren = Array.from(children.get(segment)).map((child) => {
      return { camelCase: _.camelCase(child), PascalCase: PascalCase(child), hasId: segmentIds.get(child) };
    });
    const code = engine.render('Path.njk', { segment, className, methods, myChildren });
    fs.writeFileSync(path.join(output, 'Paths', `${className}Path.go`), format_code(code));
  }
}


// the only method to export
const generate = (output: string, templates: string) => {
  initEngine(templates)
  render_definitions(output);
  render_paths(output);
}


export { generate };
