# WesleyLedger admin console setup

The admin console uses the signed-in Firebase account plus an administrator membership document. The route is `/admin`; knowing the route does not grant access. Firestore rules independently protect account listings and subscription updates.

## 1. Enable Firebase sign-in

In Firebase Console, open **Authentication → Sign-in method** and enable **Email/Password**. Create or use your own account in WesleyLedger so Firebase Authentication has a user record for you.

## 2. Deploy the Firestore rules

From the repository root, authenticate the Firebase CLI and deploy the rules to the same project configured in the app:

```powershell
firebase login
firebase deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

Replace `YOUR_FIREBASE_PROJECT_ID` with the Firebase project ID used by `VITE_FIREBASE_PROJECT_ID`. Review the Firebase CLI deployment summary and confirm the correct project before accepting the deployment.

The rules allow a signed-in user to create their own basic `users_metadata/{uid}` account record, let admins list account records and subscriptions, and restrict subscription writes and admin membership changes to the project owner through Firebase Console.

## 3. Add your first administrator

1. Sign in to WesleyLedger with your own account. If it is a new account, finish the church profile setup.
2. In Firebase Console, open **Authentication → Users** and copy your account's **User UID**.
3. Open **Firestore Database → Data**. Create a collection named `admins` if it does not exist.
4. Create a document in `admins` with the **document ID exactly equal to your User UID**. Add a simple field such as `role` (string) = `admin`.
5. Sign out and sign back in, then open `/admin` in the browser. For a hash-routed build, open `/#/admin`.

Membership is based on the existence of `admins/{your-uid}`. Do not put admin membership in `users_metadata`; users cannot modify the `admins` collection through the app. Firebase Console project access is required to add or remove administrators.

## 4. Confirm a customer's payment and grant access

Customers create an account and sign in with the same email they will give you when paying. Their account record appears in the console after their first successful online sign-in. Search by email, choose the period paid for, and select **Confirm payment & grant**. The console records the granting admin and the update time, and the customer’s app unlocks after the subscription update reaches Firestore.

The selected term extends from the later of today or the account's current expiry. **Suspend** blocks an active account without deleting its payment or expiry information. Accounts with no subscription are treated as awaiting activation, and the app blocks access if it cannot verify subscription status.

## 5. Check the access controls

- A normal signed-in account opening `/admin` should be sent back to the app and should not be able to list account records or change subscription documents.
- Your admin account should see registered accounts and be able to grant and suspend access.
- A customer without a subscription, or with an expired or suspended subscription, should see the access restriction screen after reaching the app.
- After granting access, the customer should see the app unlock without needing a reinstall or a new account.

The console does not verify incoming payments automatically. Confirm the payment in your own account before granting access. Keep your Firebase project owner account protected with a strong password and multi-factor authentication, since project owners can add administrators in Firebase Console.

## 6. Choose between admin and user workspaces

An authenticated account with an `admins/{uid}` membership is offered a portal chooser after signing in. This app does not maintain a separate user-role membership: authenticated accounts may use the normal user workspace, which continues to enforce its church-profile and subscription requirements. Standard users continue to `/app`. Both destinations retain their existing authentication, profile, subscription, and admin checks, so the chooser itself does not grant access.
