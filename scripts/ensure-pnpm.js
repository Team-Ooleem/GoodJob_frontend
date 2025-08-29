const execPath = process.env.npm_execpath || '';
console.log('[ensure-pnpm] execPath:', execPath);

if (!execPath.toLowerCase().includes('pnpm')) {
  console.error('❌ pnpm만 사용 가능합니다. 현재:', execPath || '없음');
  process.exit(1);  // 여기서 즉시 설치 중단
}
