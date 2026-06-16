# Finite
Finite is a "consciously social" platform that helps users manage their screen time while staying connected.

| Feature                  | Description                                                                             | Frontend      | Backend        |
|:-------------------------|:----------------------------------------------------------------------------------------|:--------------|:---------------|
| **Authentication**       | Login, multi-step registration, and staying logged in.                                  | Keano         | Keelan         |
| **Time Tracker**         | Daily time limit that tracks usage and blocks the app when exceeded.                    | Keano         | Thijs          |
| **Home Feed**            | Timeline with posts from followed users.                                                | Keano         | Keelan         |
| **Explore & Search**     | Discovering trending posts and searching by hashtags, keywords or users.                | Keano         | Keelan         |
| **User Profiles**        | Detailed profile pages with biography, links, and statistics.                           | Keano & Thijs | Thijs          |
| **Media Uploads**        | Integration with Cloudflare R2 for uploading avatars, banners, and post images.         | -             | Thijs          |
| **Following System**     | Users can follow/unfollow each other with automatic counter updates.                    | Keano & Thijs | Thijs          |
| **Post System**          | Creating and deleting posts with support for text and images.                           | Keano & Thijs | Thijs & Keelan |
| **Interaction (Voting)** | Upvote and downvote system for posts.                                                   | Thijs         | Keelan         |
| **Comments**             | Adding and deleting real-time comments on posts.                                        | Thijs         | Keelan         |
| **Notifications**        | Real-time notifications for new followers, upvotes, and comments via Supabase Realtime. | Keano         | Thijs          |
| **News Sidebar**         | NewsAPI integration for showing relevant headlines (with source filtering).             | Keano         | Keelan & Keano |
| **Settings**             | Managing time limits and full (irreversible) account deletion.                          | Keano         | Thijs          |
| **Other Features**       | Other smaller features like account deletion, sign out etc.                             |               | Thijs & Keelan |
| **Other UI/UX**          | Responsive design with Tailwind CSS                                                     | Keano         |                |

## Development Roles & Contributions
*   **Frontend Cleanup:** Keano was responsible for the overall code quality of the frontend, refining and improving the UI components created by the team.
*   **Backend Optimization:** Keelan focused on implementing large features, cleaning up backend logic and API routes.
*   **System Testing:** Keano and Keelan performed the majority of the testing to ensure a bug-free experience.
*   **Fullstack Development:** Thijs contributed to both the visual components, and the underlying server-side logic (like the database work).

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase
- **Storage:** Cloudflare R2 (S3 Client)
