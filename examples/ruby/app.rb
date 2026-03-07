# Ruby + Sinatra implementation of the Agent Auth pattern
#
# Run: ruby app.rb
# Skill.md: http://localhost:3001/skill.md

require 'sinatra'
require 'json'
require 'jwt'
require 'bcrypt'
require 'securerandom'

set :port, 3001

JWT_SECRET = ENV.fetch('JWT_SECRET', 'change-this-secret')
BLOCKED_HOSTS = %w[localhost 127.0.0.1 10. 172.16. 192.168. 0.0.0.0].freeze

# ==================== JWT Helpers ====================

def create_token(payload)
  payload[:exp] = Time.now.to_i + (30 * 24 * 60 * 60) # 30 days
  payload[:iat] = Time.now.to_i
  JWT.encode(payload, JWT_SECRET, 'HS256')
end

def verify_token(token)
  JWT.decode(token, JWT_SECRET, true, algorithm: 'HS256').first
rescue JWT::DecodeError
  nil
end

# ==================== Middleware ====================

# Helper to extract and verify Bearer token
def authenticate!
  auth = request.env['HTTP_AUTHORIZATION'] || ''
  unless auth.start_with?('Bearer ')
    halt 401, { 'Content-Type' => 'application/json' },
         { success: false, error: 'Missing Authorization header' }.to_json
  end

  payload = verify_token(auth[7..])
  unless payload
    halt 401, { 'Content-Type' => 'application/json' },
         { success: false, error: 'Invalid or expired token' }.to_json
  end

  payload
end

# ==================== Serve skill.md ====================

get '/skill.md' do
  content_type 'text/markdown'
  send_file File.join(settings.public_folder, 'skill.md')
end

# ==================== Agent Routes ====================

# POST /api/agents/register - No auth required
post '/api/agents/register' do
  content_type :json
  data = JSON.parse(request.body.read)

  name = data['name'].to_s
  capabilities = data['capabilities'] || []
  webhook_url = data['webhook_url']

  # Validate
  if name.empty? || name.length > 100
    halt 400, { success: false, error: 'Name required (1-100 chars)' }.to_json
  end

  if !capabilities.is_a?(Array) || capabilities.empty?
    halt 400, { success: false, error: 'Capabilities must be a non-empty array' }.to_json
  end

  if webhook_url && BLOCKED_HOSTS.any? { |b| webhook_url.include?(b) }
    halt 400, { success: false, error: 'Webhook cannot point to private addresses' }.to_json
  end

  agent_id = SecureRandom.uuid
  api_token = create_token({ id: agent_id, name: name, type: 'agent' })

  # TODO: Save to database

  status 201
  {
    success: true,
    data: {
      agent_id: agent_id,
      api_token: api_token,
      status: 'registered',
      dashboard: "/dashboard/agents/#{agent_id}"
    }
  }.to_json
end

# GET /api/agents - Requires auth
get '/api/agents' do
  content_type :json
  auth = authenticate!
  { success: true, data: [] }.to_json
end

# ==================== User Routes ====================

# POST /api/users/signup
post '/api/users/signup' do
  content_type :json
  data = JSON.parse(request.body.read)

  email = data['email'].to_s
  password = data['password'].to_s

  halt 400, { success: false, error: 'Email and password required' }.to_json if email.empty? || password.empty?
  halt 400, { success: false, error: 'Password must be 8+ characters' }.to_json if password.length < 8

  password_hash = BCrypt::Password.create(password, cost: 12)
  user_id = SecureRandom.uuid

  # TODO: Check uniqueness and save to database

  token = create_token({ id: user_id, email: email, type: 'human' })

  status 201
  {
    success: true,
    data: {
      token: token,
      user: { id: user_id, email: email }
    }
  }.to_json
end

# POST /api/users/login
post '/api/users/login' do
  content_type :json
  data = JSON.parse(request.body.read)

  email = data['email'].to_s
  password = data['password'].to_s

  halt 400, { success: false, error: 'Email and password required' }.to_json if email.empty? || password.empty?

  # TODO: Look up user and verify password
  # user = DB[:users].where(email: email).first
  # halt 401, { error: 'Invalid credentials' }.to_json unless user
  # halt 401, { error: 'Invalid credentials' }.to_json unless BCrypt::Password.new(user[:password_hash]) == password

  token = create_token({ id: 'user-id-from-db', email: email, type: 'human' })

  {
    success: true,
    data: {
      token: token,
      user: { id: 'user-id-from-db', email: email }
    }
  }.to_json
end

# ==================== Health ====================

get '/api/health' do
  content_type :json
  { status: 'ok' }.to_json
end
