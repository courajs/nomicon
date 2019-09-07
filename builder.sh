ln -s $node_modules node_modules
mkdir dist
npm run build-prod
mv dist $out;
