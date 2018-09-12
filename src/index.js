// @flow
import type {GraphQLParameters, Endpoint, GraphQLType, RootGraphQLSchema, SwaggerToGraphQLOptions, GraphQLTypeMap} from './types';
import rp from 'request-promise';
import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { getAllEndPoints, loadSchema, loadRefs } from './swagger';
import { createGQLObject, mapParametersToFields } from './typeMap';
const debug = require('debug')('swagger-to-graphql')
const OAuth   = require('oauth-1.0a');
const crypto  = require('crypto');
const querystring = require('querystring');

type Endpoints = {[string]: Endpoint};

const schemaFromEndpoints = (endpoints: Endpoints, proxyUrl, headers) => {
  const gqlTypes = {};
  const queryFields = getFields(endpoints, false, gqlTypes, proxyUrl, headers);
  if (!Object.keys(queryFields).length) {
    throw new Error('Did not find any GET endpoints');
  }
  const rootType = new GraphQLObjectType({
    name: 'Query',
    fields: queryFields
  });

  const graphQLSchema: RootGraphQLSchema = {
    query: rootType
  };

  const mutationFields = getFields(endpoints, true, gqlTypes, proxyUrl, headers);
  if (Object.keys(mutationFields).length) {
    graphQLSchema.mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: mutationFields
    });
  }

  return new GraphQLSchema(graphQLSchema);
};

const resolver = (endpoint: Endpoint, proxyUrl: ?(Function | string), customHeaders = {}) =>
  async (_, args: GraphQLParameters, opts: SwaggerToGraphQLOptions) => {
    
    const proxy = !proxyUrl ? opts.GQLProxyBaseUrl : (typeof proxyUrl === 'function' ? proxyUrl(opts) : proxyUrl);
    const req = endpoint.request(args, proxy);
    
    if (opts !== undefined && opts.headers) {
      const { host, ...otherHeaders } = opts.headers;
      req.headers = Object.assign(req.headers, otherHeaders);
    }
    
    if (customHeaders) {
      debug("(customHeaders) %O", customHeaders)
      if (customHeaders['x-oauth-v1-consumer-key']) {
        // construct the oauth object
        const oauth = OAuth({
          consumer: {
            key: customHeaders['x-oauth-v1-consumer-key'],
            secret: customHeaders['x-oauth-v1-consumer-secret']
          },
          signature_method: customHeaders['x-oauth-v1-signature-method'],
          hash_function(base_string, key) {
            return crypto.createHmac('sha1', key).update(base_string).digest('base64');
          }
        });
        debug("req.url %s", req.url + "?" + querystring.stringify(req.qs))
        const request_infos = {
          url: req.url + "?" + querystring.stringify(req.qs),
          method: req.method
        };
        //
        
        // remove OAuth params from custom headers
        const { 
          ['x-oauth-v1-consumer-secret']: _0, 
          ['x-oauth-v1-consumer-key']: _1, 
          ['x-oauth-v1-signature-method']: _2,
          ...redactedCustomHeaders } = customHeaders;
        customHeaders = redactedCustomHeaders;
        //
        
        // compute OAuth headers for the backend's request     
        customHeaders = Object.assign(customHeaders, oauth.toHeader(oauth.authorize(request_infos)))
      }

      if (customHeaders['x-proxy']) {
        req.proxy = customHeaders['x-proxy']
        // remove x-proxy from custom headers
        const { 
          ['x-proxy']: _0,
          ...redactedCustomHeaders } = customHeaders;
        customHeaders = redactedCustomHeaders;
        //
      }

      // add customHeaders to the backend's request
      req.headers = Object.assign(req.headers, customHeaders);  
    }
    
    //req.headers['accept-encoding'] = 'entity'
    req.json = true
    debug("(req) %O", req);
    
    const jsonRes = await rp(req);
    debug("(res) %O", res);

    return jsonRes;
  };

const getFields = (endpoints, isMutation, gqlTypes, proxyUrl, headers): GraphQLTypeMap => {
  return Object.keys(endpoints).filter((typeName: string) => {
    return !!endpoints[typeName].mutation === !!isMutation;
  }).reduce((result, typeName) => {
    const endpoint = endpoints[typeName];
    const type = createGQLObject(endpoint.response, typeName, false, gqlTypes);
    const gType: GraphQLType = {
      type,
      description: endpoint.description,
      args: mapParametersToFields(endpoint.parameters, typeName, gqlTypes),
      resolve: resolver(endpoint, proxyUrl, headers)
    };
    result[typeName] = gType;
    return result;
  }, {});
};

const build = async (swaggerPath: string, proxyUrl: ?(Function | string) = null, headers: ?{[string]: string}) => {
  const swaggerSchema = await loadSchema(swaggerPath);
  const refs = await loadRefs(swaggerPath);
  const endpoints = getAllEndPoints(swaggerSchema, refs);
  const schema = schemaFromEndpoints(endpoints, proxyUrl, headers);
  return schema;
};

export default build;
