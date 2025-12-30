# Figma Design Integration Guide

This guide explains how the Figma design has been integrated into the application and how to use the new design system.

## Design Tokens

The design tokens have been extracted from the Figma design and mapped to Tailwind CSS configuration. The tokens are defined in `frontend/tailwind.config.js`.

### Color Palette

- **Primary Colors**: Professional blue palette (`primary-50` to `primary-900`)
- **Neutral Colors**: Gray scale for UI elements (`neutral-50` to `neutral-900`)
- **Status Colors**: Success (green), Warning (yellow), Error (red), Info (blue)

### Typography

- **Font Family**: System fonts stack for optimal performance
- **Font Sizes**: Responsive scale from `xs` to `4xl`
- **Line Heights**: Optimized for readability

### Spacing

- Extended spacing scale with additional values (`18`, `88`, `112`, `128`)
- Consistent spacing system throughout components

### Shadows

- **Soft**: Subtle shadow for cards (`shadow-soft`)
- **Medium**: Medium shadow for elevated elements (`shadow-medium`)
- **Strong**: Strong shadow for modals (`shadow-strong`)

## Components

### ApplicationsList

A reusable component for displaying job applications with:
- Status badges with color coding
- Expandable details
- Resume download functionality
- Status history timeline integration

**Usage:**
```jsx
import ApplicationsList from '../components/ApplicationsList';

<ApplicationsList
  applications={applications}
  onDownloadResume={handleDownloadResume}
  showTimeline={true}
/>
```

### ApplicationTimeline

Displays the status history of an application in a timeline format.

**Usage:**
```jsx
import ApplicationTimeline from '../components/ApplicationTimeline';

<ApplicationTimeline history={application.status_history} />
```

### FeedCard

A card component for displaying feed posts with:
- User information
- Post content and images
- Like, comment, share, and save actions
- Post sharing to messages

**Usage:**
```jsx
import FeedCard from '../components/FeedCard';

<FeedCard
  post={post}
  currentUserId={user.id}
  onLike={handleLike}
  onComment={handleComment}
  onShare={handleShare}
  onSave={handleSave}
  onShareToMessage={handleShareToMessage}
/>
```

### PostComposer

A component for creating new posts with:
- Text input with character counter
- Image upload (up to 4 images)
- Image preview and removal
- Form validation

**Usage:**
```jsx
import PostComposer from '../components/PostComposer';

<PostComposer
  onSubmit={handleCreatePost}
  placeholder="What's on your mind?"
  maxLength={2000}
/>
```

### ConnectionsList

A reusable component for displaying connections or connection requests.

**Usage:**
```jsx
import ConnectionsList from '../components/ConnectionsList';

<ConnectionsList
  connections={connections}
  mode="connections"
  onMessage={handleMessage}
  onRemove={handleRemove}
  currentUserId={user.id}
/>
```

### MessageThread

A component for displaying and managing message conversations with:
- Message display with read receipts
- File attachments
- Post sharing
- Typing indicators support

**Usage:**
```jsx
import MessageThread from '../components/MessageThread';

<MessageThread
  conversation={conversation}
  messages={messages}
  currentUserId={user.id}
  onSendMessage={handleSendMessage}
  onSendAttachment={handleSendAttachment}
  onSharePost={handleSharePost}
/>
```

## Responsive Design

All components are responsive and follow these breakpoints:
- **Mobile**: Default (< 640px)
- **Tablet**: `md:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)

## Accessibility

Components include:
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus states for interactive elements
- Color contrast compliance

## Integration Steps

1. **Update Tailwind Config**: The design tokens are already configured in `tailwind.config.js`

2. **Import Components**: Import the new components where needed:
   ```jsx
   import ApplicationsList from '../components/ApplicationsList';
   ```

3. **Replace Existing Components**: Update pages to use the new components:
   - `MyApplications.js` - Uses `ApplicationsList` and `ApplicationTimeline`
   - `Messages.js` - Can use `MessageThread` for better UX
   - `Home.js` - Can use `FeedCard` and `PostComposer`

4. **Update Styling**: Replace old color classes with new design tokens:
   - `bg-blue-500` → `bg-primary-600`
   - `text-gray-600` → `text-neutral-600`
   - `shadow-md` → `shadow-soft`

## Customization

To customize the design:

1. **Colors**: Update the color values in `tailwind.config.js`
2. **Spacing**: Modify spacing scale in `tailwind.config.js`
3. **Components**: Edit component files in `frontend/src/components/`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Components use React hooks efficiently
- Images are lazy-loaded where appropriate
- CSS animations use GPU acceleration
- Minimal re-renders with proper React optimization

## Next Steps

1. Add Storybook stories for component documentation
2. Add unit tests for components
3. Create design system documentation site
4. Add dark mode support
5. Add internationalization (i18n)

