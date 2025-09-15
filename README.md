# WhatsApp SaaS Platform

A comprehensive WhatsApp business messaging platform built with Next.js, featuring bulk messaging, template management, campaign automation, and webhook handling.

## ✨ Features

- **User Authentication**: JWT-based secure authentication system
- **WhatsApp Integration**: Full Meta WhatsApp Business API integration
- **Template Management**: Create, sync, and manage WhatsApp message templates
- **Bulk Messaging**: Send messages to multiple contacts with scheduling
- **Campaign Management**: Automated bulk messaging campaigns
- **Contact Management**: Organize and manage your contact database
- **Real-time Webhooks**: Message status tracking and delivery updates
- **Analytics Dashboard**: Monitor your messaging performance
- **Subscription Management**: Built-in usage tracking and limits

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- WhatsApp Business API access
- Meta Business Account

### Installation

1. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd whatsapp-saas
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/whatsapp-saas

   # WhatsApp API (Get from Meta Business Manager)
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_API_VERSION=v19.0

   # Security
   JWT_SECRET=your_super_secret_jwt_key
   WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```

4. **Access the platform**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Getting Started Guide

### 1. WhatsApp Business API Setup

1. **Create Facebook Business Account**
   - Go to [Meta Business](https://business.facebook.com)
   - Create a new business account

2. **Set up WhatsApp Business API**
   - Navigate to WhatsApp Business API in Business Manager
   - Create a new WhatsApp Business Account
   - Get your credentials:
     - Business Account ID
     - Phone Number ID
     - Access Token

3. **Configure Webhooks**
   - Set webhook URL: `https://yourdomain.com/api/webhook`
   - Use your webhook verify token
   - Subscribe to message events

### 2. Platform Setup

1. **Create Account**
   - Register on the platform
   - Complete your profile

2. **Configure WhatsApp**
   - Go to Settings → WhatsApp Configuration
   - Enter your API credentials
   - Test the connection

3. **Set up Templates**
   - Navigate to Templates
   - Sync templates from WhatsApp
   - Create new templates as needed

4. **Import Contacts**
   - Go to Contacts
   - Import your contact list
   - Organize with tags and custom fields

5. **Start Messaging**
   - Create your first campaign
   - Send bulk messages
   - Monitor delivery and responses

## 🛠️ Development

### Project Structure

```
src/
├── app/
│   ├── api/                 # API endpoints
│   ├── dashboard/          # Dashboard pages
│   └── globals.css         # Global styles
├── components/             # React components
├── lib/                    # Utilities and services
└── models/                # Database models
```

### Key Components

- **WhatsApp API Service**: `src/lib/whatsapp.js`
- **Database Models**: `src/models/`
- **Authentication**: `src/app/api/auth/`
- **Webhook Handler**: `src/app/api/webhook/route.js`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/templates` | GET | List templates |
| `/api/campaigns` | POST | Create campaign |
| `/api/messages` | POST | Send message |
| `/api/webhook` | POST | WhatsApp webhooks |

### Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## 🔧 Configuration

### WhatsApp API Permissions

Ensure your WhatsApp Business API has these permissions:
- `whatsapp_business_messaging`
- `whatsapp_business_management`

### Webhook Events

Subscribe to these webhook events:
- `messages` - Incoming messages
- `message_deliveries` - Delivery status
- `message_reads` - Read receipts

### Rate Limiting

The platform implements rate limiting for:
- Message sending (1000/hour per phone number)
- Template creation (100/hour)
- API calls (10000/hour per token)

## 📊 Features Deep Dive

### Template Management
- Sync templates from WhatsApp Business API
- Support for text, image, video, document headers
- Dynamic parameter handling
- Template approval status tracking

### Bulk Messaging
- Batch processing with configurable delays
- Contact filtering and targeting
- Scheduled campaign sending
- Real-time progress tracking

### Analytics
- Message delivery rates
- Campaign performance
- Contact engagement metrics
- Usage analytics

### Contact Management
- Import from CSV/Excel
- Tag-based organization
- Custom fields support
- Unsubscribe management

## 🔒 Security

- JWT-based authentication
- Input validation and sanitization
- Rate limiting protection
- Webhook signature verification
- Environment variable security

## 🚢 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy Options**
   - **Vercel**: `vercel deploy`
   - **Netlify**: Connect GitHub repository
   - **AWS/GCP**: Use Docker or direct deployment
   - **Digital Ocean**: App Platform deployment

### Database Setup

1. **MongoDB Atlas** (Recommended)
   - Create cluster
   - Configure network access
   - Update connection string

2. **Local MongoDB**
   - Install MongoDB
   - Create database
   - Configure authentication

### Domain & SSL

1. Configure custom domain
2. Set up SSL certificate
3. Update webhook URLs in Meta Business Manager

## 🐛 Troubleshooting

### Common Issues

**WhatsApp API Errors**
- Check credentials in Business Manager
- Verify phone number status
- Ensure webhook URL is accessible

**Database Connection**
- Verify MongoDB URI format
- Check network connectivity
- Ensure database permissions

**Message Delivery**
- Confirm template approval status
- Check contact phone number format
- Verify message limits not exceeded

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=whatsapp:*
```

## 📚 API Documentation

### Authentication
All API endpoints require JWT authentication:
```bash
Authorization: Bearer <your_jwt_token>
```

### Example Requests

**Send Message**
```bash
POST /api/messages
{
  "phoneNumber": "+1234567890",
  "text": "Hello World!"
}
```

**Create Campaign**
```bash
POST /api/campaigns
{
  "name": "Summer Sale",
  "templateId": "template_id",
  "contactIds": ["contact1", "contact2"]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review common troubleshooting steps

## 🗺️ Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-user team management
- [ ] Payment integration
- [ ] WhatsApp chatbot builder
- [ ] Advanced automation rules
- [ ] API access for integrations

---

Built with ❤️ using Next.js, MongoDB, and WhatsApp Business API
