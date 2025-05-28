# MindMint 🧠✨

**Empowering Mental Wellness Through Blockchain Innovation**

A revolutionary React Native app that combines journaling, mindfulness, and Solana blockchain technology to create a unique mental health platform for Gen Z.

## 🌟 The Problem We're Solving

Mental health awareness among Gen Z is at an all-time high, but traditional mental wellness apps lack engagement and fail to provide tangible rewards for consistent self-care practices. Additionally, there's a significant knowledge gap about blockchain technology and its real-world applications among young people.

**Key Issues:**
- 📱 Low engagement rates in traditional mental health apps
- 💰 Lack of incentivization for consistent wellness practices  
- 🔒 Limited blockchain awareness and adoption among Gen Z
- 📊 Difficulty tracking long-term mental health progress
- 🎯 Missing gamification elements in wellness apps

## 💡 Our Solution

MindMint bridges the gap between mental wellness and blockchain technology by:

- **🎁 NFT Rewards**: Transform meaningful journal entries into unique NFTs
- **⚡ Solana Integration**: Fast, low-cost blockchain transactions
- **📈 Gamified Wellness**: Earn clarity points and maintain streaks
- **🔗 Blockchain Education**: Learn about Web3 through practical use
- **💎 Digital Ownership**: Own your mental health journey as digital assets

## 🎯 Delivering Solana Awareness to Gen Z

### Educational Integration
- **Practical Learning**: Users learn blockchain concepts through daily journaling
- **Real Transactions**: Experience actual Solana transactions with minimal fees
- **Wallet Management**: Hands-on experience with Phantom/Solflare wallets
- **NFT Creation**: Understand digital ownership and metadata concepts

### Accessibility
- **Mobile-First**: Native mobile app accessible to all smartphone users
- **Devnet Testing**: Safe environment to learn without financial risk
- **Simple UX**: Complex blockchain operations hidden behind intuitive interface
- **Real-Time Feedback**: Immediate confirmation of blockchain interactions

## 🚀 How MindMint Works

### Core Workflow
1. **📝 Daily Journaling**: Write reflective journal entries with mood tracking
2. **💎 NFT Minting**: Convert meaningful entries into unique Solana NFTs
3. **🏆 Streak Building**: Maintain consistency to unlock rewards and achievements
4. **📊 Progress Tracking**: Visualize mental health journey through data analytics
5. **🔗 Wallet Integration**: Connect with Phantom/Solflare for blockchain interactions

### Gamification Elements
- **Clarity Points**: Earn points for journal consistency and quality
- **Streak Counters**: Track consecutive days of journaling
- **NFT Collection**: Build a personal gallery of meaningful moments
- **Achievement System**: Unlock milestones and special rewards

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Expo** - Development platform and deployment
- **React Navigation** - Navigation and routing
- **Expo Vector Icons** - Icon library

### Blockchain Integration
- **Solana Web3.js** - Blockchain interaction
- **SPL Token** - NFT creation and management
- **Metaplex** - NFT metadata standards
- **Mobile Wallet Adapter** - Wallet connectivity

### Backend & Database
- **PostgreSQL** - Production database
- **SQLite** - Local development database
- **Node.js Polyfills** - React Native compatibility

### Development Tools
- **Metro Bundler** - JavaScript bundling
- **EAS Build** - Cloud-based app building
- **Expo Dev Client** - Custom development builds

## ✅ Current Implementation Status

### ✅ **FULLY IMPLEMENTED (Real)**
- **PostgreSQL Database**: Complete schema with users and journal_entries tables
- **Solana Wallet Integration**: Real Phantom/Solflare wallet connectivity
- **NFT Minting**: Actual SPL token creation on Solana devnet
- **Journal System**: Full CRUD operations for journal entries
- **User Management**: UUID-based user system with preferences
- **Blockchain Transactions**: Real Solana network interactions
- **Mood Tracking**: Comprehensive mood analysis and storage
- **Streak System**: Real-time tracking of journaling consistency
- **Wallet Balance**: Live SOL balance checking from devnet

### ⚙️ **PARTIALLY IMPLEMENTED**
- **IPFS Metadata**: Currently using mock IPFS URLs (development placeholder)
- **Achievement System**: Core logic implemented, UI enhancements needed
- **Analytics Dashboard**: Basic tracking implemented, advanced charts pending

### 🚧 **PLANNED FOR DEVELOPMENT**
- **Mainnet Deployment**: Currently on devnet for testing
- **Social Features**: Share NFTs with friends and community
- **Therapy Integration**: Connect with licensed mental health professionals
- **Advanced Analytics**: ML-powered mood prediction and insights
- **Cross-Chain Support**: Ethereum and Polygon integration

## 📋 Database Schema

```sql
-- Users table with comprehensive profile management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) UNIQUE,
    clarity_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries with NFT integration
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood VARCHAR(20),
    clarity_points INTEGER DEFAULT 0,
    nft_address VARCHAR(44),
    nft_transaction_signature VARCHAR(88),
    nft_metadata_uri TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🏗️ Project Architecture

```
MindMint/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens and navigation
│   ├── services/           # Business logic and API calls
│   │   ├── database/       # PostgreSQL/SQLite operations
│   │   ├── wallet/         # Solana wallet integration
│   │   └── solana/         # Blockchain interactions
│   ├── contexts/           # React context providers
│   ├── config/             # App configuration
│   └── utils/              # Helper functions
├── database/               # Database schema and migrations
├── polyfills.js           # React Native polyfills
└── metro.config.js        # Metro bundler configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- PostgreSQL 14+
- Android Studio / Xcode (for device testing)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/mindmint.git
cd mindmint

# Install dependencies
npm install

# Set up PostgreSQL database
createdb mindmint
psql mindmint < database/schema.sql

# Start development server
npm start
```

### Development Workflow
1. **Local Testing**: Use `npm start` for rapid iteration
2. **Device Testing**: Scan QR code with Expo Dev Client
3. **Production Build**: Use `eas build` for distribution

## 🌟 Future Roadmap

### Phase 1: Enhanced Features (Q1 2024)
- **Real IPFS Integration**: Decentralized metadata storage
- **Advanced Mood Analytics**: AI-powered insights
- **Social NFT Sharing**: Community features
- **Therapy Marketplace**: Professional mental health integration

### Phase 2: Ecosystem Expansion (Q2 2024)
- **Mainnet Launch**: Production Solana deployment
- **Token Economics**: $MINT utility token
- **DAO Governance**: Community-driven development
- **Cross-Chain Bridge**: Multi-blockchain support

### Phase 3: Scale & Impact (Q3-Q4 2024)
- **University Partnerships**: Mental health research collaboration
- **Therapist SDK**: Tools for mental health professionals
- **Global Expansion**: Multi-language support
- **Enterprise Solutions**: Corporate wellness programs

## 📊 Impact Metrics

**Target Goals:**
- 🎯 **10,000+** Active users learning about Solana
- 📱 **50,000+** NFTs minted representing mental health journeys  
- 🏆 **80%** User retention rate for 30+ days
- 🌟 **95%** User satisfaction with blockchain integration

## 🤝 Contributing

We welcome contributions from developers, mental health professionals, and blockchain enthusiasts!

### Ways to Contribute:
- **🐛 Bug Reports**: Help us identify and fix issues
- **💡 Feature Requests**: Suggest new functionality
- **📝 Documentation**: Improve our guides and tutorials
- **🔧 Code Contributions**: Submit pull requests
- **🎨 UI/UX Design**: Enhance user experience

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Solana Foundation** for blockchain infrastructure
- **Expo Team** for React Native development platform
- **Mental Health Community** for guidance and feedback
- **Open Source Contributors** for polyfills and tools

---

**Built with ❤️ for Mental Health and Blockchain Education**

*MindMint is bridging the gap between wellness and Web3, one journal entry at a time.* 