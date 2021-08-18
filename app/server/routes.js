const querystring = require('querystring');
const qs = require('qs');
const axios = require("axios");
const appConfig = require('config');
const _ = require('lodash');
const ROOT_URL = appConfig.get('root_url');
const { v4: uuidv4 } = require('uuid');
const htmlEntities = require('html-entities');
const {promisify} = require('util');
const redis = require("redis");
const redisClient = redis.createClient();

const redisGetAsync = promisify(redisClient.get).bind(redisClient);

const auth_server_url = appConfig.get('auth-server-url');
const realm_name = appConfig.get('realm');
const client_id = appConfig.get('client_id');
const client_secret = appConfig.get('client_secret');
const page_title = appConfig.get('page_title');

const HomeURL = `${ROOT_URL}/login`;

module.exports = function(app) {

	app.get('/', function(req, res){
		res.redirect(HomeURL);
	})

	// main login page //
	// app.get('/login', async (req, res) => {
		
	// 	res.render('visit', {
	// 		ROOT_URL: ROOT_URL,
	// 		page_title: page_title
	// 	});
		
	// });

	app.get('/login', (req, res) => {
		const redirectClientURL = `${ROOT_URL}/ipification/callback`;
		const state = uuidv4();
		const nonce = uuidv4();

		let params = {
			response_type: 'code',
			scope: 'openid ip:mobile_id',
			client_id: client_id,
			redirect_uri: redirectClientURL,
			state: state,
			nonce: nonce,
		};

		let authUrl = `${auth_server_url}/realms/${realm_name}/protocol/openid-connect/auth?` + querystring.stringify(params);
		console.log("auth url: ", authUrl)
		res.redirect(authUrl);

	})

	app.get('/ipification/callback', async function(req, res){
		console.log('ip callback');
		const redirectClientURL = `${ROOT_URL}/ipification/callback`;

		let tokenEndpointURL = auth_server_url + '/realms/' + realm_name + '/protocol/openid-connect/token';
		let userEndpointURL = auth_server_url + '/realms/' + realm_name + '/protocol/openid-connect/userinfo';

		if(req.query.error){
			console.log('ip callback error');
			console.log(req.query)
			res.status(200).send(htmlEntities.encode(req.query.error));
			return;
		}

		let requestBody = {
			code: req.query.code,
			redirect_uri: redirectClientURL,
			grant_type: 'authorization_code',
			client_id: client_id,
			client_secret: client_secret
		};

		const config = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}

		try {
			console.log('ip callback get userinfo');
			const tokenResponse = await axios.post(tokenEndpointURL, qs.stringify(requestBody), config)
			const { access_token } = tokenResponse.data;
			const userResponse = await axios.post(userEndpointURL, qs.stringify({access_token: access_token}))
			const data = userResponse.data;
			const { sub } = data;
			const counterKey = `${sub}:count`;

			redisClient.incr(counterKey)

			res.render('visit', {
				ROOT_URL: ROOT_URL,
				page_title: page_title,
				total: await redisGetAsync(counterKey)
			});

		} catch (err) {
			console.log('ip callback error');
			console.log(err.message);
			res.redirect(HomeURL);
		}

		
	})

	
	// app.get('*', function(req, res) { 
	// 	res.redirect(`${ROOT_URL}/login`);
	// });

};
