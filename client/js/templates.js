// Not bad for small scale ¯\_(ツ)_/¯
const templates = {
  POST_EDITOR: () => `
<input id="post-editor-title" type="text" placeholder="Enter post title...">
<textarea id="post-editor-content" placeholder="Enter post content..."></textarea>
`,

  USER_BOOKMARKS: () => `
<div id="user-bookmarks-container" class="scroll-container"></div>
<div class="center">
  <button id="user-bookmarks-prev-btn"> 
    <i class="fas fa-caret-left"></i>
  </button>
  <button id="user-bookmarks-next-btn">
    <i class="fas fa-caret-right"></i>
  </button>
</div>`,

  POST_COMMENTS: () => `
<div id="comments-container" class="scroll-container"></div>
<div class="center">
  <button id="comments-prev-btn"><i class="fas fa-caret-left"></i></button>
  <button id="comments-next-btn"><i class="fas fa-caret-right"></i></button>
</div>`,

  USER_LOGIN: () => `
<h2>Login</h2>
<input type="text" id="login-username" placeholder="Username">
<input type="password" id="login-password" placeholder="Password">
<p class="link-swal-auth text-forget-password" role="button" tabindex="0" data-target="password_recovery">
  Forgot your password?
</p>
<p class="text-swal-auth">
    Need an account? <span class="link-swal-auth" role="button" tabindex="0" data-target="signup">Sign up</span>
</p>
`,

  USER_SIGNUP: () => `
<h2>Sign Up</h2>
<input type="text" id="signup-username" placeholder="Username">
<input type="password" id="signup-password" placeholder="Password">
<p class="text-swal-auth">
    Already have an account? <span class="link-swal-auth" role="button" tabindex="0" data-target="login">Log in</span>
</p>
`,

  USER_PROFILE: (state) => `
${state?.user?.isLoggedInUser ? `
  <div class="center">
    <button id="profile-bookmarks-btn" class="w-full">
       <i class="fas fa-bookmark"></i>
       Load bookmarks
    </button>
  </div>
` : ""}

<div id="user-posts-container" class="scroll-container">
  <button id="profile-load-posts-btn" class="w-full">
    <i class="fas fa-download"></i>
    Load Posts
  </button>
</div>

<div class="center" style="margin-top: 10px">
  <button id="profile-posts-prev-btn">
    <i class="fas fa-caret-left"></i>
  </button>
  <button id="profile-posts-next-btn">
    <i class="fas fa-caret-right"></i>
  </button>
</div>
`
}

export default templates;
