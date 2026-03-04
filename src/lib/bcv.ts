import https from 'https';

export async function getBcvRate() {
  try {
    const url = "https://www.bcv.org.ve";
    
    console.log("Fetching BCV Euro rate...");

    // Function to fetch HTML using https module to ignore SSL errors (verify=False equivalent)
    const fetchHtml = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'www.bcv.org.ve',
          port: 443,
          path: '/',
          method: 'GET',
          rejectUnauthorized: false, // This is the equivalent of verify=False
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve(data));
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error("Timeout fetching BCV"));
        });
        req.end();
      });
    };

    let html = "";
    try {
      html = await fetchHtml();
      console.log("BCV HTML length:", html.length);
    } catch (e: any) {
      console.error("Direct BCV fetch failed:", e.message);
    }

    if (html) {
      // Pattern 1: Search for "EURO" label specifically followed by a value in a strong tag
      // This matches the structure: <div id="euro">...<strong> 45,1234 </strong>
      const euroMatch = html.match(/id=['"]euro['"][\s\S]*?<strong>\s*([\d,.]+)\s*<\/strong>/);
      if (euroMatch && euroMatch[1]) {
        console.log("BCV Rate found with Pattern 1 (EURO ID):", euroMatch[1]);
        return euroMatch[1].trim().replace(',', '.');
      }

      // Pattern 2: Specific class (backup) - usually the same structure
      const rateMatch = html.match(/<div[^>]*class=['"]col-sm-6 col-xs-6 centrado['"][^>]*>[\s\S]*?<strong>\s*([\d,.]+)\s*<\/strong>/);
      // Note: Pattern 2 might return Dollar if it's the first one, so Pattern 1 is preferred
      if (rateMatch && rateMatch[1] && html.includes('id="euro"')) {
         // Only use Pattern 2 if we can't find it with Pattern 1 but we know Euro is there
         // Actually, let's stick to Pattern 1 as it's more specific to Euro
      }
    }

    console.log("BCV direct scraping failed or no HTML. Attempting fallback API...");
    
    // Fallback: Using DolarAPI's Euro endpoint
    try {
      const fallbackResponse = await fetch("https://ve.dolarapi.com/v1/euros/oficial", { next: { revalidate: 3600 } });
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.promedio) {
          console.log("BCV euro Rate found via Fallback API:", data.promedio);
          return data.promedio.toString();
        }
      }
    } catch (e) {
      console.error("Fallback API call failed:", e);
    }

    throw new Error("Could not find Euro rate in BCV HTML or Fallback API");
  } catch (error) {
    console.error("Error in getBcvRate (Euro):", error);
    return null;
  }
}
