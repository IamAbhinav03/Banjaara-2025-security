# Banjaara Entry-Exit Portal

A secure and efficient portal for managing external participants' entry and exit during the cultural fest.

## Features

- Secure volunteer authentication
- CSV data import for external participants
- Two-step check-in process (Gate-in and Check-in)
- Two-step check-out process (Check-out and Gate-out)
- Real-time status tracking
- Admin dashboard for data management
- Automatic timestamp logging
- Role-based access control

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account and project

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/banjaara-sec.git
cd banjaara-sec
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. Set up Firebase:

   - Create a new Firebase project
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Set up security rules for Firestore

5. Start the development server:

```bash
npm run dev
```

## Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // External participants
    match /externals/{externalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Action logs
    match /actionLogs/{logId} {
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
    }
  }
}
```

## CSV Format

The CSV file for importing external participants should have the following columns:

- name: Full name of the participant
- email: Email address
- type: One of 'participant', 'attendee', or 'on-the-spot'
- feePaid: 'true' or 'false'

Example:

```csv
name,email,type,feePaid
John Doe,john@example.com,participant,true
Jane Smith,jane@example.com,attendee,false
```

## Usage

1. **Admin Setup**:

   - Log in as an admin
   - Upload the CSV file containing external participants' data
   - The system will generate unique 6-digit UIDs for each participant

2. **Volunteer Operations**:

   - Log in with volunteer credentials
   - Enter the participant's UID
   - Follow the two-step check-in/check-out process
   - System automatically logs all actions with timestamps

3. **Security Features**:
   - Role-based access control
   - Secure authentication
   - Action logging for audit trails
   - Fee verification before entry

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
