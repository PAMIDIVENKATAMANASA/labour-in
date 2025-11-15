/**
 * ⚠️ NOTE: This file is NOT used by Vercel for this project.
 * 
 * This is a Vite + React project, not a Next.js project.
 * Vercel uses vercel.json for Vite projects.
 * 
 * This file can be safely removed or kept for reference.
 * The URL routing is handled by React Router in src/App.tsx.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Add other configurations here if needed
  
    async rewrites() {
      return [
        // --- CORE FIX: Map standard lowercase URLs to your capitalized file names ---
        
        // 1. Core Login Fix
        {
          source: '/login', 
          destination: '/Login', // Maps /login to pages/Login.tsx
        },
        {
            source: '/signup', 
            destination: '/Signup', // Maps /login to pages/Login.tsx
          },
  
        // 2. Dashboard and Management Pages
        {
          source: '/admindashboard', 
          destination: '/AdminDashboard', // Maps /admindashboard to pages/AdminDashboard.tsx
        },
        {
          source: '/adminskillmanagementpage', 
          destination: '/AdminSkillManagementPage',
        },
        {
          source: '/adminusermanagementpage', 
          destination: '/AdminUserManagementPage',
        },
        {
          source: '/coordinatordashboard', 
          destination: '/CoordinatorDashboard',
        },
        {
          source: '/employerapplicants', 
          destination: '/EmployerApplicants',
        },
        {
          source: '/employerdashboard', 
          destination: '/EmployerDashboard',
        },
        {
          source: '/employerjobdetails', 
          destination: '/EmployerJobDetails',
        },
        {
          source: '/laborerdashboard', 
          destination: '/LaborerDashboard',
        },
        
        // 3. Simple Pages
        {
          source: '/about',
          destination: '/About', // Maps /about to pages/About.tsx
        },
        {
          source: '/contact', 
          destination: '/Contact', // Maps /contact to pages/Contact.tsx
        },
        {
          source: '/findwork', 
          destination: '/FindWork',
        },
        {
          source: '/hiretalent', 
          destination: '/HireTalent',
        },
        // --- END REWRITES ---
      ];
    },
  };
  
  module.exports = nextConfig;