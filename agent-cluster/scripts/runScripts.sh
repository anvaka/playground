
# BEGIN: Two loops calling node scripts
for X in {1..10}; do
  for Y in {1..5}; do
    node ./generateDotFiles.js $X $Y > ${X}_${Y}.dot && node createImageFromDot.js ${X}_${Y}.dot
  done
done
# END: Two loops calling node scripts
