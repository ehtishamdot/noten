# Kajabi Embedding Guide for Note Ninjas

## Overview
This guide explains how to embed the Note Ninjas application into Kajabi for seamless integration with your course or membership platform.

## Embed URL
The embed-friendly version of Note Ninjas is available at:
```
https://your-domain.com/embed
```

## Implementation Methods

### Method 1: Direct iFrame Embed (Recommended)

Add the following HTML code to your Kajabi page:

```html
<iframe
  src="https://your-domain.com/embed"
  width="100%"
  height="900px"
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  allowfullscreen
></iframe>
```

#### Responsive iFrame
For a responsive iframe that adjusts to content height:

```html
<div style="position: relative; padding-bottom: 100%; height: 0; overflow: hidden;">
  <iframe
    src="https://your-domain.com/embed"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allowfullscreen
  ></iframe>
</div>
```

### Method 2: Custom Code Block in Kajabi

1. Log into your Kajabi admin panel
2. Navigate to the page where you want to embed Note Ninjas
3. Add a new "Custom Code" block
4. Paste the iframe code from Method 1
5. Save and publish your page

### Method 3: Full-Width Embed

For a full-width, immersive experience:

```html
<style>
  .note-ninjas-embed {
    width: 100%;
    min-height: 100vh;
    border: none;
    margin: 0;
    padding: 0;
  }

  .embed-container {
    margin: 0 -20px; /* Removes Kajabi's default padding */
    padding: 0;
  }
</style>

<div class="embed-container">
  <iframe
    src="https://your-domain.com/embed"
    class="note-ninjas-embed"
    frameborder="0"
    allowfullscreen
  ></iframe>
</div>
```

## Features Available in Embed Mode

The embed version includes:

✅ **Simple Mode**: Quick 3-field input for fast case creation
✅ **Detailed Mode**: Comprehensive patient assessment with 8+ fields
✅ **Treatment Plan Generation**: AI-powered recommendations
✅ **6 Treatment Subsections**:
   - Manual Therapy Techniques
   - Progressive Strengthening Protocol
   - Neuromuscular Re-education
   - Work-Specific Functional Training
   - Pain Management Modalities
   - Home Exercise Program

✅ **Exercise Details**:
   - Therapeutic cues (verbal, tactile, visual)
   - Documentation examples
   - CPT codes
   - Clinical notes

❌ **Not Included in Embed**:
   - User authentication
   - Case history/saving
   - User account features
   - Navigation sidebar

## Customization Options

### Adjust Height
Modify the `height` parameter in the iframe tag:
```html
<iframe ... height="1200px" ...></iframe>
```

### Add Loading State
```html
<div id="loading-state" style="text-align: center; padding: 40px;">
  <p>Loading Note Ninjas...</p>
</div>

<iframe
  src="https://your-domain.com/embed"
  onload="document.getElementById('loading-state').style.display='none';"
  style="display: none;"
  width="100%"
  height="900px"
  frameborder="0"
></iframe>

<script>
  window.addEventListener('load', function() {
    document.querySelector('iframe').style.display = 'block';
  });
</script>
```

## Testing Checklist

Before going live, verify:

- [ ] iFrame loads correctly on desktop
- [ ] iFrame loads correctly on mobile devices
- [ ] Form submission works
- [ ] Treatment recommendations generate successfully
- [ ] Exercise modals open and display correctly
- [ ] All CPT codes display properly
- [ ] No console errors
- [ ] Scrolling works smoothly

## User Experience Notes

1. **Session Management**: Each embed instance is independent. Users won't see case history across sessions.

2. **Mobile Responsiveness**: The embed is fully responsive but ensure your Kajabi theme allows for proper mobile display.

3. **Performance**: The AI generation typically takes 10-30 seconds. Users will see a loading state during this time.

4. **Navigation**: After generating a treatment plan, users can click "New Case" to start over.

## Troubleshooting

### Issue: iFrame not loading
**Solution**: Check that your domain allows iframe embedding. Add these headers to your server:
```
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors 'self' https://*.mykajabi.com
```

### Issue: Height is cut off
**Solution**: Increase the iframe height or use the responsive method with `padding-bottom: 100%`

### Issue: Slow loading
**Solution**: Ensure your OpenAI API key is properly configured and has sufficient quota

### Issue: Styling conflicts
**Solution**: The embed uses its own isolated styles. If issues persist, wrap the iframe in a container with `position: relative; isolation: isolate;`

## Security Considerations

1. **API Keys**: Ensure your OpenAI API key is stored securely as an environment variable
2. **CORS**: Configure CORS headers to allow embedding from Kajabi domains
3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
4. **Data Privacy**: The embed version doesn't store user data long-term

## Support

For technical support or questions about the embed implementation:
- Contact: [your-support-email]
- Documentation: [your-docs-url]

## Black Friday Promotion Integration

For the November Black Friday promotion (running through November 28):

1. Add a banner above the iframe:
```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
  <h2 style="margin: 0 0 10px 0;">🎉 Black Friday Special - 50% Off!</h2>
  <p style="margin: 0;">Get unlimited access to Note Ninjas through November 28th</p>
</div>

<iframe src="https://your-domain.com/embed" ...></iframe>
```

2. Update your Kajabi pricing or add a coupon code for the promotional period.

## Updates and Maintenance

This embed is designed to receive automatic updates. Major changes will be communicated via:
- Email notifications
- In-app changelog
- This documentation file

---

**Last Updated**: November 2024
**Version**: 1.0
**Compatible with**: Kajabi, Teachable, Thinkific, and other LMS platforms that support iframe embedding
