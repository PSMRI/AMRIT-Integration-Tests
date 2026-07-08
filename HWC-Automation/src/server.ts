import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  InitializeRequestSchema,
  InitializedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from "playwright";

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let consoleLogs: any[] = [];
let currentDownload: any = null;

// Helper function to set up page event listeners
function setupPageListeners(page: Page) {
  consoleLogs = []; // Reset logs for new page

  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: Date.now()
    });
  });

  page.on('download', download => {
    currentDownload = download;
  });
}

const server = new Server(
  {
    name: "playwright-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle initialize request
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: request.params.protocolVersion,
    capabilities: {
      tools: {
        listChanged: true
      }
    },
    serverInfo: {
      name: "playwright-mcp",
      version: "1.0.0"
    }
  };
});

// Handle initialized notification
server.setNotificationHandler(InitializedNotificationSchema, async () => {
  // Server is now initialized
});

// Register tool properly
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Browser Management Tools
      {
        name: "launch_browser",
        description: "Launch Chromium, Firefox, or WebKit browser",
        inputSchema: {
          type: "object",
          properties: {
            browser: {
              type: "string",
              enum: ["chromium", "firefox", "webkit"],
              description: "Browser type to launch"
            },
            headless: {
              type: "boolean",
              description: "Run in headless mode"
            },
            slowMo: {
              type: "number",
              description: "Slow down operations by specified milliseconds"
            },
            viewport: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" }
              },
              description: "Viewport size"
            }
          },
          required: ["browser"]
        }
      },
      {
        name: "close_browser",
        description: "Close the active browser session",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "new_context",
        description: "Create a new isolated browser context",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "new_page",
        description: "Open a new tab/page in the current context",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },

      // Navigation Tools
      {
        name: "goto",
        description: "Navigate to a URL",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to navigate to"
            },
            waitUntil: {
              type: "string",
              enum: ["load", "domcontentloaded", "networkidle"],
              description: "When to consider navigation complete"
            }
          },
          required: ["url"]
        }
      },
      {
        name: "reload",
        description: "Refresh the current page",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "go_back",
        description: "Navigate backward in browser history",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "go_forward",
        description: "Navigate forward in browser history",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },

      // Interaction Tools
      {
        name: "click",
        description: "Click on an element by selector",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element to click"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "fill",
        description: "Fill an input field",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the input element"
            },
            value: {
              type: "string",
              description: "Value to fill"
            }
          },
          required: ["selector", "value"]
        }
      },
      {
        name: "type",
        description: "Type text with delay (simulates real typing)",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the input element"
            },
            text: {
              type: "string",
              description: "Text to type"
            },
            delay: {
              type: "number",
              description: "Delay between keystrokes in milliseconds"
            }
          },
          required: ["selector", "text"]
        }
      },
      {
        name: "select_option",
        description: "Select an option from a dropdown",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the select element"
            },
            value: {
              type: "string",
              description: "Value to select"
            }
          },
          required: ["selector", "value"]
        }
      },
      {
        name: "check",
        description: "Check a checkbox",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the checkbox"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "uncheck",
        description: "Uncheck a checkbox",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the checkbox"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "press_key",
        description: "Press a keyboard key",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element to focus (optional)"
            },
            key: {
              type: "string",
              description: "Key to press (e.g., 'Enter', 'Tab', 'ArrowDown')"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "hover",
        description: "Hover mouse over an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element to hover"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "drag_and_drop",
        description: "Drag an element and drop it on another element",
        inputSchema: {
          type: "object",
          properties: {
            sourceSelector: {
              type: "string",
              description: "CSS selector of the element to drag"
            },
            targetSelector: {
              type: "string",
              description: "CSS selector of the drop target"
            }
          },
          required: ["sourceSelector", "targetSelector"]
        }
      },

      // Wait & Synchronization Tools
      {
        name: "wait_for_selector",
        description: "Wait for an element to appear",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector to wait for"
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "wait_for_timeout",
        description: "Wait for a specified amount of time",
        inputSchema: {
          type: "object",
          properties: {
            milliseconds: {
              type: "number",
              description: "Time to wait in milliseconds"
            }
          },
          required: ["milliseconds"]
        }
      },
      {
        name: "wait_for_navigation",
        description: "Wait for page navigation to complete",
        inputSchema: {
          type: "object",
          properties: {
            waitUntil: {
              type: "string",
              enum: ["load", "domcontentloaded", "networkidle"],
              description: "When to consider navigation complete"
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds"
            }
          }
        }
      },
      {
        name: "wait_for_response",
        description: "Wait for a network response",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL pattern to wait for"
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds"
            }
          },
          required: ["url"]
        }
      },

      // Extraction Tools
      {
        name: "get_text",
        description: "Extract text content from an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "get_attribute",
        description: "Extract attribute value from an element",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element"
            },
            attribute: {
              type: "string",
              description: "Attribute name to extract"
            }
          },
          required: ["selector", "attribute"]
        }
      },
      {
        name: "get_html",
        description: "Extract HTML content from an element or page",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element (optional, gets page HTML if not provided)"
            }
          }
        }
      },
      {
        name: "screenshot",
        description: "Take a screenshot of the page or element",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of element to screenshot (optional, screenshots full page if not provided)"
            },
            filename: {
              type: "string",
              description: "Filename for the screenshot"
            },
            fullPage: {
              type: "boolean",
              description: "Take full page screenshot"
            }
          }
        }
      },
      {
        name: "get_title",
        description: "Get the page title",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_url",
        description: "Get the current page URL",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },

      // Assertion Tools
      {
        name: "assert_text",
        description: "Assert that an element contains specific text",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element"
            },
            expectedText: {
              type: "string",
              description: "Expected text content"
            }
          },
          required: ["selector", "expectedText"]
        }
      },
      {
        name: "assert_visible",
        description: "Assert that an element is visible",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element"
            }
          },
          required: ["selector"]
        }
      },
      {
        name: "assert_url",
        description: "Assert that the current URL matches expected URL",
        inputSchema: {
          type: "object",
          properties: {
            expectedUrl: {
              type: "string",
              description: "Expected URL"
            }
          },
          required: ["expectedUrl"]
        }
      },
      {
        name: "assert_count",
        description: "Assert the count of elements matching a selector",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector"
            },
            expectedCount: {
              type: "number",
              description: "Expected number of elements"
            }
          },
          required: ["selector", "expectedCount"]
        }
      },

      // Advanced Automation Tools
      {
        name: "execute_script",
        description: "Execute custom JavaScript in the browser context",
        inputSchema: {
          type: "object",
          properties: {
            script: {
              type: "string",
              description: "JavaScript code to execute"
            }
          },
          required: ["script"]
        }
      },
      {
        name: "upload_file",
        description: "Upload a file to a file input element",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the file input element"
            },
            filePath: {
              type: "string",
              description: "Path to the file to upload"
            }
          },
          required: ["selector", "filePath"]
        }
      },
      {
        name: "intercept_request",
        description: "Intercept and modify network requests",
        inputSchema: {
          type: "object",
          properties: {
            urlPattern: {
              type: "string",
              description: "URL pattern to intercept"
            },
            responseBody: {
              type: "string",
              description: "Mock response body"
            },
            statusCode: {
              type: "number",
              description: "Mock status code"
            }
          },
          required: ["urlPattern"]
        }
      },
      {
        name: "block_resources",
        description: "Block specific resource types from loading",
        inputSchema: {
          type: "object",
          properties: {
            resourceTypes: {
              type: "array",
              items: {
                type: "string",
                enum: ["image", "stylesheet", "script", "font", "media"]
              },
              description: "Types of resources to block"
            }
          },
          required: ["resourceTypes"]
        }
      },

      // Cookie Management Tools
      {
        name: "get_cookies",
        description: "Get all cookies from the current context",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Optional URL to get cookies for"
            }
          }
        }
      },
      {
        name: "set_cookie",
        description: "Set a cookie",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Cookie name"
            },
            value: {
              type: "string",
              description: "Cookie value"
            },
            url: {
              type: "string",
              description: "URL to set cookie for"
            },
            domain: {
              type: "string",
              description: "Cookie domain"
            },
            path: {
              type: "string",
              description: "Cookie path"
            },
            expires: {
              type: "number",
              description: "Expiration timestamp"
            },
            httpOnly: {
              type: "boolean",
              description: "HTTP only flag"
            },
            secure: {
              type: "boolean",
              description: "Secure flag"
            },
            sameSite: {
              type: "string",
              enum: ["Strict", "Lax", "None"],
              description: "SameSite policy"
            }
          },
          required: ["name", "value"]
        }
      },
      {
        name: "delete_cookie",
        description: "Delete a specific cookie",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Cookie name to delete"
            },
            url: {
              type: "string",
              description: "URL associated with the cookie"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "clear_cookies",
        description: "Clear all cookies from the current context",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },

      // Tracing Tools
      {
        name: "start_tracing",
        description: "Start tracing browser activity",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Optional filename for the trace file"
            },
            screenshots: {
              type: "boolean",
              description: "Include screenshots in trace"
            },
            snapshots: {
              type: "boolean",
              description: "Include DOM snapshots in trace"
            }
          }
        }
      },
      {
        name: "stop_tracing",
        description: "Stop tracing and save the trace file",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },

      // Console Logs Tools
      {
        name: "get_console_logs",
        description: "Get all console messages from the page",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "clear_console_logs",
        description: "Clear all console messages",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },

      // Download Handling Tools
      {
        name: "wait_for_download",
        description: "Wait for a file download to complete",
        inputSchema: {
          type: "object",
          properties: {
            timeout: {
              type: "number",
              description: "Timeout in milliseconds"
            }
          }
        }
      },
      {
        name: "get_download_path",
        description: "Get the path of the most recent download",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Browser Management Tools
    if (name === "launch_browser") {
      const browserType = (args as any)?.browser as string;
      const headless = (args as any)?.headless as boolean || false;
      const slowMo = (args as any)?.slowMo as number || 0;
      const viewport = (args as any)?.viewport as { width: number; height: number };

      if (browser) {
        await browser.close();
      }

      let launchOptions: any = { headless, slowMo };
      if (viewport) {
        launchOptions.viewport = viewport;
      }

      switch (browserType) {
        case "chromium":
          browser = await chromium.launch(launchOptions);
          break;
        case "firefox":
          browser = await firefox.launch(launchOptions);
          break;
        case "webkit":
          browser = await webkit.launch(launchOptions);
          break;
        default:
          throw new Error(`Unsupported browser: ${browserType}`);
      }

      context = await browser.newContext();
      page = await context.newPage();

      // Set up event listeners for console logs and downloads
      setupPageListeners(page);

      return {
        content: [
          {
            type: "text",
            text: `Launched ${browserType} browser successfully`
          }
        ]
      };
    }

    if (name === "close_browser") {
      if (browser) {
        await browser.close();
        browser = null;
        context = null;
        page = null;
      }

      return {
        content: [
          {
            type: "text",
            text: "Browser closed successfully"
          }
        ]
      };
    }

    if (name === "new_context") {
      if (!browser) {
        throw new Error("Browser not launched. Use launch_browser first.");
      }
      context = await browser.newContext();
      page = await context.newPage();

      // Set up event listeners
      setupPageListeners(page);

      return {
        content: [
          {
            type: "text",
            text: "New browser context created"
          }
        ]
      };
    }

    if (name === "new_page") {
      if (!context) {
        throw new Error("No active context. Use launch_browser or new_context first.");
      }
      page = await context.newPage();

      // Set up event listeners
      setupPageListeners(page);

      return {
        content: [
          {
            type: "text",
            text: "New page/tab opened"
          }
        ]
      };
    }

    // Ensure we have an active page for subsequent operations
    if (!page) {
      throw new Error("No active page. Use launch_browser first.");
    }

    // Navigation Tools
    if (name === "goto") {
      const url = (args as any)?.url as string;
      const waitUntil = (args as any)?.waitUntil as string || "load";

      if (!url) {
        throw new Error("URL is required");
      }

      await page.goto(url, { waitUntil: waitUntil as any });

      return {
        content: [
          {
            type: "text",
            text: `Navigated to ${url}`
          }
        ]
      };
    }

    if (name === "reload") {
      await page.reload();

      return {
        content: [
          {
            type: "text",
            text: "Page reloaded"
          }
        ]
      };
    }

    if (name === "go_back") {
      await page.goBack();

      return {
        content: [
          {
            type: "text",
            text: "Navigated back"
          }
        ]
      };
    }

    if (name === "go_forward") {
      await page.goForward();

      return {
        content: [
          {
            type: "text",
            text: "Navigated forward"
          }
        ]
      };
    }

    // Interaction Tools
    if (name === "click") {
      const selector = (args as any)?.selector as string;
      if (!selector) {
        throw new Error("Selector is required");
      }

      await page.click(selector);

      return {
        content: [
          {
            type: "text",
            text: `Clicked element: ${selector}`
          }
        ]
      };
    }

    if (name === "fill") {
      const selector = (args as any)?.selector as string;
      const value = (args as any)?.value as string;
      if (!selector || value === undefined) {
        throw new Error("Selector and value are required");
      }

      await page.fill(selector, value);

      return {
        content: [
          {
            type: "text",
            text: `Filled ${selector} with: ${value}`
          }
        ]
      };
    }

    if (name === "type") {
      const selector = (args as any)?.selector as string;
      const text = (args as any)?.text as string;
      const delay = (args as any)?.delay as number || 100;

      if (!selector || !text) {
        throw new Error("Selector and text are required");
      }

      await page.type(selector, text, { delay });

      return {
        content: [
          {
            type: "text",
            text: `Typed "${text}" in ${selector} with ${delay}ms delay`
          }
        ]
      };
    }

    if (name === "select_option") {
      const selector = (args as any)?.selector as string;
      const value = (args as any)?.value as string;

      if (!selector || !value) {
        throw new Error("Selector and value are required");
      }

      await page.selectOption(selector, value);

      return {
        content: [
          {
            type: "text",
            text: `Selected option "${value}" in ${selector}`
          }
        ]
      };
    }

    if (name === "check") {
      const selector = (args as any)?.selector as string;
      if (!selector) {
        throw new Error("Selector is required");
      }

      await page.check(selector);

      return {
        content: [
          {
            type: "text",
            text: `Checked checkbox: ${selector}`
          }
        ]
      };
    }

    if (name === "uncheck") {
      const selector = (args as any)?.selector as string;
      if (!selector) {
        throw new Error("Selector is required");
      }

      await page.uncheck(selector);

      return {
        content: [
          {
            type: "text",
            text: `Unchecked checkbox: ${selector}`
          }
        ]
      };
    }

    if (name === "press_key") {
      const selector = (args as any)?.selector as string;
      const key = (args as any)?.key as string;

      if (!key) {
        throw new Error("Key is required");
      }

      if (selector) {
        await page.focus(selector);
      }

      await page.keyboard.press(key);

      return {
        content: [
          {
            type: "text",
            text: `Pressed key: ${key}${selector ? ` on ${selector}` : ''}`
          }
        ]
      };
    }

    if (name === "hover") {
      const selector = (args as any)?.selector as string;
      if (!selector) {
        throw new Error("Selector is required");
      }

      await page.hover(selector);

      return {
        content: [
          {
            type: "text",
            text: `Hovered over: ${selector}`
          }
        ]
      };
    }

    if (name === "drag_and_drop") {
      const sourceSelector = (args as any)?.sourceSelector as string;
      const targetSelector = (args as any)?.targetSelector as string;

      if (!sourceSelector || !targetSelector) {
        throw new Error("Source and target selectors are required");
      }

      await page.dragAndDrop(sourceSelector, targetSelector);

      return {
        content: [
          {
            type: "text",
            text: `Dragged ${sourceSelector} to ${targetSelector}`
          }
        ]
      };
    }

    // Wait & Synchronization Tools
    if (name === "wait_for_selector") {
      const selector = (args as any)?.selector as string;
      const timeout = (args as any)?.timeout as number || 10000;

      if (!selector) {
        throw new Error("Selector is required");
      }

      await page.waitForSelector(selector, { timeout });

      return {
        content: [
          {
            type: "text",
            text: `Element ${selector} is now visible`
          }
        ]
      };
    }

    if (name === "wait_for_timeout") {
      const milliseconds = (args as any)?.milliseconds as number;
      if (milliseconds === undefined) {
        throw new Error("Milliseconds is required");
      }

      await page.waitForTimeout(milliseconds);

      return {
        content: [
          {
            type: "text",
            text: `Waited for ${milliseconds} milliseconds`
          }
        ]
      };
    }

    if (name === "wait_for_navigation") {
      const waitUntil = (args as any)?.waitUntil as string || "load";
      const timeout = (args as any)?.timeout as number || 30000;

      await page.waitForLoadState(waitUntil as any, { timeout });

      return {
        content: [
          {
            type: "text",
            text: `Navigation completed (${waitUntil})`
          }
        ]
      };
    }

    if (name === "wait_for_response") {
      const url = (args as any)?.url as string;
      const timeout = (args as any)?.timeout as number || 30000;

      if (!url) {
        throw new Error("URL is required");
      }

      await page.waitForResponse(url, { timeout });

      return {
        content: [
          {
            type: "text",
            text: `Response received for: ${url}`
          }
        ]
      };
    }

    // Extraction Tools
    if (name === "get_text") {
      const selector = (args as any)?.selector as string;
      if (!selector) {
        throw new Error("Selector is required");
      }

      const text = await page.textContent(selector);

      return {
        content: [
          {
            type: "text",
            text: text || "No text found"
          }
        ]
      };
    }

    if (name === "get_attribute") {
      const selector = (args as any)?.selector as string;
      const attribute = (args as any)?.attribute as string;

      if (!selector || !attribute) {
        throw new Error("Selector and attribute are required");
      }

      const value = await page.getAttribute(selector, attribute);

      return {
        content: [
          {
            type: "text",
            text: value || "Attribute not found"
          }
        ]
      };
    }

    if (name === "get_html") {
      const selector = (args as any)?.selector as string;

      let html: string;
      if (selector) {
        html = await page.innerHTML(selector);
      } else {
        html = await page.content();
      }

      return {
        content: [
          {
            type: "text",
            text: html
          }
        ]
      };
    }

    if (name === "screenshot") {
      const selector = (args as any)?.selector as string;
      const filename = (args as any)?.filename as string || `screenshot_${Date.now()}.png`;
      const fullPage = (args as any)?.fullPage as boolean || true;

      const screenshotPath = `./${filename}`;

      if (selector) {
        await page.locator(selector).screenshot({ path: screenshotPath });
      } else {
        await page.screenshot({ path: screenshotPath, fullPage });
      }

      return {
        content: [
          {
            type: "text",
            text: `Screenshot saved as: ${screenshotPath}`
          }
        ]
      };
    }

    if (name === "get_title") {
      const title = await page.title();

      return {
        content: [
          {
            type: "text",
            text: title
          }
        ]
      };
    }

    if (name === "get_url") {
      const url = page.url();

      return {
        content: [
          {
            type: "text",
            text: url
          }
        ]
      };
    }

    // Assertion Tools
    if (name === "assert_text") {
      const selector = (args as any)?.selector as string;
      const expectedText = (args as any)?.expectedText as string;

      if (!selector || !expectedText) {
        throw new Error("Selector and expectedText are required");
      }

      const actualText = await page.textContent(selector);
      if (actualText !== expectedText) {
        throw new Error(`Text assertion failed. Expected: "${expectedText}", Got: "${actualText}"`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Text assertion passed: "${expectedText}"`
          }
        ]
      };
    }

    if (name === "assert_visible") {
      const selector = (args as any)?.selector as string;
      if (!selector) {
        throw new Error("Selector is required");
      }

      const isVisible = await page.isVisible(selector);
      if (!isVisible) {
        throw new Error(`Element ${selector} is not visible`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Element ${selector} is visible`
          }
        ]
      };
    }

    if (name === "assert_url") {
      const expectedUrl = (args as any)?.expectedUrl as string;
      if (!expectedUrl) {
        throw new Error("Expected URL is required");
      }

      const currentUrl = page.url();
      if (currentUrl !== expectedUrl) {
        throw new Error(`URL assertion failed. Expected: "${expectedUrl}", Got: "${currentUrl}"`);
      }

      return {
        content: [
          {
            type: "text",
            text: `URL assertion passed: "${expectedUrl}"`
          }
        ]
      };
    }

    if (name === "assert_count") {
      const selector = (args as any)?.selector as string;
      const expectedCount = (args as any)?.expectedCount as number;

      if (!selector || expectedCount === undefined) {
        throw new Error("Selector and expectedCount are required");
      }

      const actualCount = await page.locator(selector).count();
      if (actualCount !== expectedCount) {
        throw new Error(`Count assertion failed. Expected: ${expectedCount}, Got: ${actualCount}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Count assertion passed: ${expectedCount} elements`
          }
        ]
      };
    }

    // Advanced Automation Tools
    if (name === "execute_script") {
      const script = (args as any)?.script as string;
      if (!script) {
        throw new Error("Script is required");
      }

      const result = await page.evaluate(script);

      return {
        content: [
          {
            type: "text",
            text: `Script executed. Result: ${JSON.stringify(result)}`
          }
        ]
      };
    }

    if (name === "upload_file") {
      const selector = (args as any)?.selector as string;
      const filePath = (args as any)?.filePath as string;

      if (!selector || !filePath) {
        throw new Error("Selector and filePath are required");
      }

      await page.setInputFiles(selector, filePath);

      return {
        content: [
          {
            type: "text",
            text: `File uploaded: ${filePath} to ${selector}`
          }
        ]
      };
    }

    if (name === "intercept_request") {
      const urlPattern = (args as any)?.urlPattern as string;
      const responseBody = (args as any)?.responseBody as string;
      const statusCode = (args as any)?.statusCode as number || 200;

      if (!urlPattern) {
        throw new Error("URL pattern is required");
      }

      await page.route(urlPattern, route => {
        route.fulfill({
          status: statusCode,
          body: responseBody || ''
        });
      });

      return {
        content: [
          {
            type: "text",
            text: `Request interception set up for: ${urlPattern}`
          }
        ]
      };
    }

    if (name === "block_resources") {
      const resourceTypes = (args as any)?.resourceTypes as string[];
      if (!resourceTypes || !Array.isArray(resourceTypes)) {
        throw new Error("Resource types array is required");
      }

      await page.route('**/*', route => {
        const request = route.request();
        if (resourceTypes.includes(request.resourceType())) {
          route.abort();
        } else {
          route.continue();
        }
      });

      return {
        content: [
          {
            type: "text",
            text: `Blocked resource types: ${resourceTypes.join(', ')}`
          }
        ]
      };
    }

    // Cookie Management Tools
    if (name === "get_cookies") {
      if (!context) {
        throw new Error("No active context. Use launch_browser first.");
      }

      const url = (args as any)?.url as string;
      const cookies = url ? await context.cookies(url) : await context.cookies();

      return {
        content: [
          {
            type: "text",
            text: `Found ${cookies.length} cookies: ${JSON.stringify(cookies, null, 2)}`
          }
        ]
      };
    }

    if (name === "set_cookie") {
      if (!context) {
        throw new Error("No active context. Use launch_browser first.");
      }

      const cookie = args as any;
      await context.addCookies([{
        name: cookie.name,
        value: cookie.value,
        url: cookie.url,
        domain: cookie.domain,
        path: cookie.path || "/",
        expires: cookie.expires,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite || "Lax"
      }]);

      return {
        content: [
          {
            type: "text",
            text: `Cookie "${cookie.name}" set successfully`
          }
        ]
      };
    }

    if (name === "delete_cookie") {
      if (!context) {
        throw new Error("No active context. Use launch_browser first.");
      }

      const cookieName = (args as any)?.name as string;
      if (!cookieName) {
        throw new Error("Cookie name is required");
      }

      await context.clearCookies({ name: cookieName });

      return {
        content: [
          {
            type: "text",
            text: `Cookie "${cookieName}" deleted successfully`
          }
        ]
      };
    }

    if (name === "clear_cookies") {
      if (!context) {
        throw new Error("No active context. Use launch_browser first.");
      }

      await context.clearCookies();

      return {
        content: [
          {
            type: "text",
            text: "All cookies cleared successfully"
          }
        ]
      };
    }

    // Tracing Tools
    if (name === "start_tracing") {
      if (!context) {
        throw new Error("No active context. Use launch_browser first.");
      }

      const filename = (args as any)?.filename as string || `trace_${Date.now()}.zip`;
      const screenshots = (args as any)?.screenshots as boolean || false;
      const snapshots = (args as any)?.snapshots as boolean || false;

      await context.tracing.start({
        name: filename,
        screenshots,
        snapshots
      });

      return {
        content: [
          {
            type: "text",
            text: `Tracing started. Will save to: ${filename}`
          }
        ]
      };
    }

    if (name === "stop_tracing") {
      if (!context) {
        throw new Error("No active context. Use launch_browser first.");
      }

      const tracePath = `./trace_${Date.now()}.zip`;
      await context.tracing.stop({ path: tracePath });

      return {
        content: [
          {
            type: "text",
            text: `Tracing stopped. Saved to: ${tracePath}`
          }
        ]
      };
    }

    // Console Logs Tools
    if (name === "get_console_logs") {
      return {
        content: [
          {
            type: "text",
            text: `Found ${consoleLogs.length} console messages: ${JSON.stringify(consoleLogs, null, 2)}`
          }
        ]
      };
    }

    if (name === "clear_console_logs") {
      consoleLogs = [];
      return {
        content: [
          {
            type: "text",
            text: "Console logs cleared"
          }
        ]
      };
    }

    // Download Handling Tools
    if (name === "wait_for_download") {
      const timeout = (args as any)?.timeout as number || 30000;

      const download = await page.waitForEvent('download', { timeout });
      currentDownload = download;

      return {
        content: [
          {
            type: "text",
            text: `Download started: ${download.suggestedFilename()}`
          }
        ]
      };
    }

    if (name === "get_download_path") {
      if (!currentDownload) {
        throw new Error("No download in progress. Use wait_for_download first.");
      }

      const downloadPath = await currentDownload.path();

      return {
        content: [
          {
            type: "text",
            text: `Download saved to: ${downloadPath}`
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${(error as Error).message}`
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
