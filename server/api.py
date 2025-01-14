import json, urllib
from os import environ as env, path
from flask import Flask, request, jsonify, _app_ctx_stack
from flask_restplus import Resource, Api
from flask_restplus import fields
from flask_restplus import inputs
from flask_restplus import reqparse
from regr import get_crime_prediction
from regr import last_month_history
#get_crime_prediction(lga, crime_type):

from flask_cors import cross_origin
from jose import jwt
from dotenv import load_dotenv
from functools import wraps

load_dotenv(path.join(path.dirname(__file__), '.env'))
auth0_domain = env['AUTH0_DOMAIN']
api_audience = env['API_ID']

app = Flask(__name__)
api = Api(app,
    default="Assignment ",  # Default namespace
    title="COMP9321 Assignment 3",  # Documentation Title
    description="Demo - Build ML model for predicting crime"
      # Documentation Description
)

def handle_error(error, status_code):
    resp = jsonify(error)
    resp.status_code = status_code
    return resp


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth:
            return handle_error({'code': 'authorization_header_missing',
                                'description':
                                    'Authorization header is expected'}, 401)

        parts = auth.split()

        if parts[0].lower() != 'bearer':
            return handle_error({'code': 'invalid_header',
                                'description':
                                    'Authorization header must start with'
                                    'Bearer'}, 401)
        elif len(parts) == 1:
            return handle_error({'code': 'invalid_header',
                                'description': 'Token not found'}, 401)
        elif len(parts) > 2:
            return handle_error({'code': 'invalid_header',
                                'description': 'Authorization header must be'
                                 'Bearer + \s + token'}, 401)

        token = parts[1]
        jsonurl = urllib.request.urlopen('https://'+auth0_domain+'/.well-known/jwks.json')
        jwks = json.loads(jsonurl.read())
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=unverified_header['alg'],
                    audience=api_audience,
                    issuer='https://'+auth0_domain+'/'
                )
            except jwt.ExpiredSignatureError:
                return handle_error({'code': 'token_expired',
                                    'description': 'token is expired'}, 401)
            except jwt.JWTClaimsError:
                return handle_error({'code': 'invalid_claims',
                                    'description': 'incorrect claims, please check the audience and issuer'}, 401)
            except Exception:
                return handle_error({'code': 'invalid_header',
                                    'description': 'Unable to parse authentication'
                                    ' token.'}, 400)

            _app_ctx_stack.top.current_user = payload
            return f(*args, **kwargs)
        return handle_error({'code': 'invalid_header',
                             'description': 'Unable to find appropriate key'}, 400)    
    return decorated

@api.route('/v/<string:location>/<string:crime_type>')
class SecPredictCrime(Resource):
    @api.response(404, 'Did not work')
    @api.response(200, 'Successful')
    @api.doc(description="Get a prediction of the crime in a particular location")
    @cross_origin(headers=['Content-Type', 'Authorization'])
    @cross_origin(headers=['Access-Control-Allow-Origin', '*'])
    @requires_auth
    def get(self, location, crime_type):
        crime_rate = get_crime_prediction(location,crime_type)
        #print(f'crime rate is {crime_rate}')
        return {'crimetype': crime_type, 'location':location, 'crime_rate':crime_rate}

@api.route('/<string:location>/<string:crime_type>')
class PredictCrime(Resource):
    @api.response(404, 'Did not work')
    @api.response(200, 'Successful')
    @api.doc(description="Get a prediction of the crime in a particular location")
    def get(self, location, crime_type):
        try:
            crime_rate = int(get_crime_prediction(location,crime_type))
        except KeyError as e:
            print("Suburb name entered incorrectly")
            return "Suburb name entered incorrectly",404
        except ValueError as e:
            print("crimetype entered incorrectly")
            return "crimetype entered incorrectly",404
        #print(f'crime rate is {crime_rate}')
        return {'crimetype': crime_type, 'location':location, 'crime_rate':crime_rate}, 200

@api.route('/<string:location>/<string:crime_type>/<int:crime_pred>')
class ComparePast(Resource):
    @api.response(404, 'Did not work')
    @api.response(200, 'Successful')
    @api.doc(description="Get a comparison of how the suburb is likely to change")
    def get(self, location, crime_type,crime_pred):
        newval= int(crime_pred)
        oldval = last_month_history(location, crime_type)
        if int(oldval)> crime_pred:
            status ="Dangerous"
        else:
            status="Safer"
        try:
            change_percent = "{0:.2f}".format(abs(((float(newval)-oldval)/oldval)*100))

        except ZeroDivisionError as e:
            return "previous number is 0. Cant compute percentage change" ,404
        
        return {"status":status, "percentage_change":change_percent }



if __name__ == '__main__':
	# run the application
    app.run(debug=True, host='127.0.0.1', port=env.get('PORT', 5000))