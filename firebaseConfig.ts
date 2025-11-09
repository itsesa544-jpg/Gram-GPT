// জরুরি: নিচের মানগুলো আপনার নিজের ফায়ারবেজ প্রজেক্টের কনফিগারেশন দিয়ে প্রতিস্থাপন করুন।
// এই মানগুলো ছাড়া আপনার লগইন/সাইন-আপ কাজ করবে না।
//
// যেভাবে মানগুলো পাবেন:
// 1. আপনার ফায়ারবেজ প্রজেক্টে যান: https://console.firebase.google.com/
// 2. Project settings (গিয়ার আইকনে ক্লিক করুন) > General tab-এ যান।
// 3. "Your apps" সেকশন থেকে আপনার ওয়েব অ্যাপটি খুঁজুন।
// 4. সেখান থেকে SDK setup and configuration অবজেক্টটি কপি করে নিচের মানগুলো পূরণ করুন।

export const firebaseConfig = {
  // আপনি যে কী-টি দিয়েছেন, আমি এখানে বসিয়ে দিয়েছি।
  apiKey: "AIzaSyDrUbMJWNdK9auoKPCPQ3irnOljvUd096c",

  // নিচের মানগুলো আপনাকে আপনার ফায়ারবেজ প্রজেক্ট থেকে এনে বসাতে হবে।
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
