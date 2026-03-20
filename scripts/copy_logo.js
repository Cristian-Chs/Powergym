const fs = require('fs');
const src = 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\32671fe2-790a-44d9-ab3a-baf17e4589f8\\media__1773964056271.png';
const dest = 'd:\\PROGAMAR\\Gym\\public\\logo.png';
try {
  const buf = fs.readFileSync(src);
  fs.writeFileSync(dest, buf);
  process.stdout.write('COPIED_SUCCESS');
} catch (e) {
  process.stderr.write(e.message);
  process.exit(1);
}
