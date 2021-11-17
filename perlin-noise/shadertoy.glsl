#define PI 3.14
float hash(vec2 p, float seed) {
  return mod(
    sin(dot(p, vec2(357.9, 1124.6))) * seed * 345678.5432101,
  1.);
}

float dotWithGradient(vec2 p, vec2 offset, float seed) {
  vec2 corner = floor(p) + offset;
  float angle = hash(corner, seed) * PI * 2.;
  return dot(p - corner, vec2(cos(angle), sin(angle)));
}

float interpolate(float x, float a, float b) {
  return a + (x * x * x * (x * (x * 6. - 15.) + 10.)) * (b - a);
}

float noise(vec2 p, float seed) {
  vec2 iCell = floor(p);
  float tl = dotWithGradient(p, vec2(0., 0.), seed);
  float tr = dotWithGradient(p, vec2(1., 0.), seed);
  float bl = dotWithGradient(p, vec2(0., 1.), seed);
  float br = dotWithGradient(p, vec2(1., 1.), seed);
  
  float xTop = interpolate(p.x - iCell.x, tl, tr);
  float xBottom = interpolate(p.x - iCell.x, bl, br);
  return (interpolate(p.y - iCell.y, xTop, xBottom) + 1.)/2.;
}

float getLight(vec3 lightDirection, vec3 pointNormal) {
  return max(0., dot(lightDirection, pointNormal));
}

vec3 getFinalColor(float lightIntensity, 
vec3 ambientColor, 
vec3 lightColor, 
vec3 pointColor) {
  return pointColor * (ambientColor + lightColor * lightIntensity);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    // Time varying pixel color
    vec3 other = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

    vec3 col = vec3(0.);
    vec2 p = uv;// + other.xy;
    float c = noise(p*30., 2.);
    vec3 pointColor = vec3(0.95, 0.92, 0.84);
    vec3 ambientColor = vec3(0);
    vec3 lightColor = vec3(0.95, 0.92, 0.84);
    vec3 lightPos = vec3(
      (cos(iTime) + 1.)/2., 
      (sin(iTime) + 1.)/2., 
      0.2);
      
    vec3 lightDirection = normalize(lightPos - vec3(uv, 0.));
    vec3 pointNormal = normalize(vec3(0, c, 1.));
    float lightIntensity = getLight(lightDirection, pointNormal);
    col.rgb = getFinalColor(lightIntensity, ambientColor, lightColor, pointColor);
    //col.b = noise(p + other.xy, 3.);

    fragColor = vec4(col,1.0);
}