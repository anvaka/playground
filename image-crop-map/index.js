import getImage from "./imageLayer.js";
// import discordClient from "./discordClient.js";

var map = new maplibregl.Map({
  container: 'map',
  zoom: 1,
  minZoom: 1,
  pitchWithRotate: false,
  layers: []
});
const loadedImages = new Map();
const countryBackground = {
  'Afghanistan': 'images-small/anvaka_Most_stereotypical_person_in_Afghanistan_9d2b5ee8-23f2-444a-bcbc-1024458e2ae1.webp',
  'Angola': 'images-small/anvaka_Most_stereotypical_person_in_Angola_e85bf80a-34cd-41dd-8236-7ad5d3cdc4c2.webp',
  'United Republic of Tanzania': 'images-small/anvaka_Most_stereotypical_person_in_United_Republic_of_Tanzania_35e3021a-91f8-4a21-8dc1-fa48eace29a9.webp',
  'Albania': 'images-small/anvaka_Most_stereotypical_person_in_Albania_93f83a42-5529-4ca2-8956-52db6fb3b771.webp',
  'United Arab Emirates': 'images-small/anvaka_Most_stereotypical_person_in_United_Arab_Emirates_2de717b9-9293-41e2-9f17-413e52a46624.webp',
  "Armenia": "images-small/anvaka_Most_stereotypical_person_in_Armenia_d0fd4337-b3cc-463c-9af3-7cd0fa976196.webp",
  "Australia": "images-small/anvaka_Most_stereotypical_person_in_Australia_3d9e6c7a-4686-427b-929e-f8dfe607e549.webp",
  "Argentina": "images-small/anvaka_Most_stereotypical_person_in_Argentina_5aeddb54-1561-4881-b480-cb563a2dedf2.webp",
  "French Southern and Antarctic Lands": "images-small/anvaka_Most_stereotypical_person_in_French_Southern_and_Antarct_c3e9bd2d-0d9b-4faf-bb44-ee9b7c20e088.webp",
"Antarctica": "images-small/anvaka_Most_stereotypical_person_in_Antarctica_24d45ea7-30a6-43d0-94d9-65091d5fa022.webp",
"Burundi": "images-small/anvaka_Most_stereotypical_person_in_Burundi_27a45f61-fc18-441d-b38f-97f4ecf8b3a5.webp",
"Belgium": "images-small/anvaka_Most_stereotypical_person_in_Belgium_d49917be-85de-4b43-852f-a81137dbfa1d.webp",
"Azerbaijan": "images-small/anvaka_Most_stereotypical_person_in_Azerbaijan_f8a6393a-5ad0-4206-a814-a66c8c5cf438.webp",
"Austria": "images-small/anvaka_Most_stereotypical_person_in_Austria_545c457e-3aee-44d4-8805-19682bfd122a.webp",
"Burkina Faso": "images-small/anvaka_Most_stereotypical_person_in_Burkina_Faso_e1e1ca0e-571f-495c-b6f8-f77a4788b154.webp",
"Bulgaria": "images-small/anvaka_Most_stereotypical_person_in_Bulgaria_d2c926e0-dcaf-45a2-b5d5-a705bd4d7969.webp",
"Benin": "images-small/anvaka_Most_stereotypical_person_in_Benin_bf2fb31b-5325-4974-98d4-226e9e57b7bf.webp",
"The Bahamas": "images-small/anvaka_Most_stereotypical_person_in_The_Bahamas_14e32a50-ed95-4388-87d2-998412db9a09.webp",
"Bangladesh": "images-small/anvaka_Most_stereotypical_person_in_Bangladesh_e2e0838a-9034-4aa6-8ac6-765f1cdb3c19.webp",
"Bosnia and Herzegovina": "images-small/anvaka_Most_stereotypical_person_in_Bosnia_and_Herzegovina_b903c2bd-1f25-4ef4-85ec-ce3c8daa399a.webp",
"Bolivia": "images-small/anvaka_Most_stereotypical_person_in_Bolivia_f0b96796-98e5-4afe-85b9-0d3a42188e95.webp",
"Bhutan": "images-small/anvaka_Most_stereotypical_person_in_Bhutan_a9160c99-bf6f-44c3-8a3b-14aef11e667b.webp",
"Belarus": "images-small/anvaka_Most_stereotypical_person_in_Belarus_3dafba38-9bf1-4b3b-9f14-bd7f5eb1c958.webp",
"Belize": "images-small/anvaka_Most_stereotypical_person_in_Belize_b93e6ad0-228d-44b0-b501-fa9afd1c8b9d.webp",
"Brazil": "images-small/anvaka_Most_stereotypical_person_in_Brazil_2fd57e30-d297-4ec5-b3a3-a81e9156dc2d.webp",
"Brunei": "images-small/anvaka_Most_stereotypical_person_in_Brunei_dca25879-b9ce-424a-97a7-ff6d9406e9e9.webp",
"Central African Republic": "images-small/anvaka_Most_stereotypical_person_in_Central_African_Republic_2b55be09-8664-4ae6-94a0-7f9735d9fa35.webp",
"Botswana": "images-small/anvaka_Most_stereotypical_person_in_Botswana_fac4f0f0-8af3-40a0-a73d-2565ad2abc36.webp",
"China": "images-small/anvaka_Most_stereotypical_person_in_China_dedbf318-c479-42b2-a0a7-e258645bde11.webp",
"Ivory Coast": "images-small/anvaka_Most_stereotypical_person_in_Ivory_Coast_539f47bc-5b85-41fd-8355-13a66c1ecff9.webp",
"Switzerland": "images-small/anvaka_Most_stereotypical_person_in_Switzerland_925f57fc-517c-4be6-9387-341aa02906c0.webp",
"Chile": "images-small/anvaka_Most_stereotypical_person_in_Chile_90447d14-42c6-445d-8317-7ef46762d97a.webp",
"Democratic Republic of the Congo": "images-small/anvaka_Most_stereotypical_person_in_Democratic_Republic_of_the__88f5ea5c-2b50-4644-9088-806e7f8643f1.webp",
"Colombia": "images-small/anvaka_Most_stereotypical_person_in_Colombia_05f2446f-1662-4a33-a7fe-5a385473a4c0.webp",
"Cuba": "images-small/anvaka_Most_stereotypical_person_in_Cuba_505e899a-45d1-4c01-a6b6-5faed682030c.webp",
"Cameroon": "images-small/anvaka_Most_stereotypical_person_in_Cameroon_93efc720-6a30-4250-aa12-ff64d23bb6d3.webp",
"Costa Rica": "images-small/anvaka_Most_stereotypical_person_in_Costa_Rica_b8d1d897-aa4a-4280-a6dc-d4d0c992e8af.webp",
"Cyprus": "images-small/anvaka_Most_stereotypical_person_in_Cyprus_0da37c5a-7df6-4442-9548-138b9b6f881c.webp",
"Czech Republic": "images-small/anvaka_Most_stereotypical_person_in_Czech_Republic_6642100c-6a12-4f1d-8829-bcf5bf79dc38.webp",
"Northern Cyprus": "images-small/anvaka_Most_stereotypical_person_in_Northern_Cyprus_89325b7a-9d6a-4afe-bbd7-454f9a453f95.webp",
"Republic of Congo": "images-small/anvaka_Most_stereotypical_person_in_Republic_of_Congo_6cbbbcde-bd80-4cee-810c-dd31b80e90ed.webp",
"Eritrea": "images-small/anvaka_Most_stereotypical_person_in_Eritrea_e2804215-c8ed-40ca-8ae4-0f89436f6818.webp",
"Algeria": "images-small/anvaka_Most_stereotypical_person_in_Algeria_309271f8-6cd9-47b1-a54f-196560ebb57e.webp",
"Ecuador": "images-small/anvaka_Most_stereotypical_person_in_Ecuador_39d2924a-29c3-4bb8-9512-7cd12bda264b.webp",
"Egypt": "images-small/anvaka_Most_stereotypical_person_in_Egypt_276b45cd-53c3-4d4f-83cf-1369fde84adc.webp",
"Ethiopia": "images-small/anvaka_Most_stereotypical_person_in_Ethiopia_875f758a-7bdd-4ee5-90f0-05bf969fe36d.webp",
"Estonia": "images-small/anvaka_Most_stereotypical_person_in_Estonia_17843181-6644-4bc2-a5bb-ecbae56220ba.webp",
"Germany": "images-small/anvaka_Most_stereotypical_person_in_Germany_c84132f1-9aba-48c6-9c53-64c4006f24e0.webp",
"Dominican Republic": "images-small/anvaka_Most_stereotypical_person_in_Dominican_Republic_483e8eef-94de-4eb8-bb4e-b871620b03ad.webp",
"Spain": "images-small/anvaka_Most_stereotypical_person_in_Spain_41583871-b7e3-4581-b27b-fe96695153c0.webp",
"Finland": "images-small/anvaka_Most_stereotypical_person_in_Finland_63de388b-7b60-4f80-b9ee-7367824d52c8.webp",
"Denmark": "images-small/anvaka_Most_stereotypical_person_in_Denmark_15fbee6a-a535-493f-9c6d-420348f7b488.webp",
"Djibouti": "images-small/anvaka_Most_stereotypical_person_in_Djibouti_2a67924e-0005-4546-9c26-beb889c6c208.webp",
"Equatorial Guinea": "images-small/anvaka_Most_stereotypical_person_in_Equatorial_Guinea_8cfc9205-e5fd-4433-a3a1-2d1b3bfe0c68.webp",
"Guinea Bissau": "images-small/anvaka_Most_stereotypical_person_in_Guinea_Bissau_577e06cc-06de-443b-b86e-f3970af181b9.webp",
"Gambia": "images-small/anvaka_Most_stereotypical_person_in_Gambia_d9660de5-22d7-4a3b-808a-752bcb181e04.webp",
"Greece": "images-small/anvaka_Most_stereotypical_person_in_Greece_7fc1bc07-25dc-4bf4-9b7a-16b9d015fc63.webp",
"Fiji": "images-small/anvaka_Most_stereotypical_person_in_Fiji_31d0dbe2-3bab-40fe-b89a-bec0319fbe3c.webp",
"Ghana": "images-small/anvaka_Most_stereotypical_person_in_Ghana_11ac3d06-c530-4267-b9b8-042c12396d1a.webp",
"Guinea": "images-small/anvaka_Most_stereotypical_person_in_Guinea_215f7d96-3719-4a08-8b50-5b2e889af909.webp",
"France": "images-small/anvaka_Most_stereotypical_person_in_France_354c7239-69d1-437e-a2cf-ab599f8a186c.webp",
"Gabon": "images-small/anvaka_Most_stereotypical_person_in_Gabon_39aac924-7d34-4e78-8e06-99a64ad89287.webp",
"United Kingdom": "images-small/anvaka_Most_stereotypical_person_in_United_Kingdom_36b85cb0-a046-4f4f-9c89-12c66be689ba.webp",
"Georgia": "images-small/anvaka_Most_stereotypical_person_in_Georgia_1995e131-4f32-4159-b34c-7b08f148e6b6.webp",
"Falkland Islands": "images-small/anvaka_Most_stereotypical_person_in_Falkland_Islands_d7f7a5e5-ab99-4ca7-969a-dcf6f052b9d2.webp",
"Iceland": "images-small/anvaka_Most_stereotypical_person_in_Iceland_768fafd4-f5d6-4ed1-8e61-ae42f5073994.webp",
"Haiti": "images-small/anvaka_Most_stereotypical_person_in_Haiti_22c3688e-2bfa-4ca6-afde-e46e3a8c702a.webp",
"Greenland": "images-small/anvaka_Most_stereotypical_person_in_Greenland_6293c700-d045-4f3f-8c7f-94edcc27e933.webp",
"India": "images-small/anvaka_Most_stereotypical_person_in_India_39b94548-c0ce-4f92-8f7c-55976ab0d72f.webp",
"Israel": "images-small/anvaka_Most_stereotypical_person_in_Israel_9f9853d3-4740-407d-9523-f507a1cfae52.webp",
"Croatia": "images-small/anvaka_Most_stereotypical_person_in_Croatia_07caed82-abd0-4210-b40f-14afc26ced5c.webp",
"Hungary": "images-small/anvaka_Most_stereotypical_person_in_Hungary_fa6da161-727e-4eae-aea2-63eb7a325a88.webp",
"Honduras": "images-small/anvaka_Most_stereotypical_person_in_Honduras_13eb63c5-3ab3-4fe0-829c-e13627f1a57b.webp",
"Indonesia": "images-small/anvaka_Most_stereotypical_person_in_Indonesia_86cc568d-6257-4b63-8a66-bd33eb118557.webp",
"Iran": "images-small/anvaka_Most_stereotypical_person_in_Iran_00ddd0a5-eead-40bb-8b9c-e2c5a433c2cd.webp",
"Iraq": "images-small/anvaka_Most_stereotypical_person_in_Iraq_9d9fbfde-0cd6-48e2-bb7c-241353712ee2.webp",
"Guatemala": "images-small/anvaka_Most_stereotypical_person_in_Guatemala_c88c48d7-ed78-4e46-a19d-362f673400f9.webp",
"Ireland": "images-small/anvaka_Most_stereotypical_person_in_Ireland_f3eaaaab-5015-4c8d-b274-5230bf8f38bb.webp",
"Guyana": "images-small/anvaka_Most_stereotypical_person_in_Guyana_5b2746fa-94b7-4979-ae19-6fcdece67aaa.webp",
"Liberia": "images-small/anvaka_Most_stereotypical_person_in_Liberia_87ae7a40-80bc-4ea1-b0ae-de579d78a14c.webp",
"Cambodia": "images-small/anvaka_Most_stereotypical_person_in_Cambodia_c4d17cae-8eb6-47e5-9a12-aafe51f949c0.webp",
"Jordan": "images-small/anvaka_Most_stereotypical_person_in_Jordan_57cba69a-dbc8-40ad-bfdb-dd79d2ac5ce7.webp",
"South Korea": "images-small/anvaka_Most_stereotypical_person_in_South_Korea_65970a85-f6af-4090-ac95-d12c6d377c89.webp",
"Laos": "images-small/anvaka_Most_stereotypical_person_in_Laos_432284be-cb45-48fa-887b-3758ff1a997e.webp",
"Kenya": "images-small/anvaka_Most_stereotypical_person_in_Kenya_0959f651-7a05-43b1-a754-e2b066ce533b.webp",
"Sri Lanka": "images-small/anvaka_Most_stereotypical_person_in_Sri_Lanka_d0443fd0-0f4b-4bf3-9676-295781d7924a.webp",
"Kyrgyzstan": "images-small/anvaka_Most_stereotypical_person_in_Kyrgyzstan_59ff3216-76b0-4c58-984e-bb59a37c5afb.webp",
"Italy": "images-small/anvaka_Most_stereotypical_person_in_Italy_79c5aa05-530e-47de-b1d1-a82100f03b36.webp",
"Jamaica": "images-small/anvaka_Most_stereotypical_person_in_Jamaica_8466a9a9-b59e-41d8-a01b-8079568376f4.webp",
"Japan": "images-small/anvaka_Most_stereotypical_person_in_Japan_757d3b01-bc5c-43ad-8b0b-54dfca420cf3.webp",
"Kuwait": "images-small/anvaka_Most_stereotypical_person_in_Kuwait_9cfd3eea-e706-4514-914c-04bdc6579c8e.webp",
"Kazakhstan": "images-small/anvaka_Most_stereotypical_person_in_Kazakhstan_4f5459bc-ad46-423b-883f-391e6a780b94.webp",
"Lebanon": "images-small/anvaka_Most_stereotypical_person_in_Lebanon_8c25f230-c527-4adc-abd1-bf3910e7e37d.webp",
"Kosovo": "images-small/anvaka_Most_stereotypical_person_in_Kosovo_42ed3282-3b08-48a7-a4c8-12829f1ac2a8.webp",
"Macedonia": "images-small/anvaka_Most_stereotypical_person_in_Macedonia_8c0efa57-8e81-4851-a6c0-3c1eb85b64a2.webp",
"Madagascar": "images-small/anvaka_Most_stereotypical_person_in_Madagascar_7ca903c2-108e-4387-ad15-8836b142621b.webp",
"Myanmar": "images-small/anvaka_Most_stereotypical_person_in_Myanmar_044a4114-1873-4eb0-bca4-5506455b1b7d.webp",
"Montenegro": "images-small/anvaka_Most_stereotypical_person_in_Montenegro_bf028056-88f6-43c3-9409-004e2703bc8e.webp",
"Luxembourg": "images-small/anvaka_Most_stereotypical_person_in_Luxembourg_2c59a039-7f76-4a08-bfec-4ed4a859443a.webp",
"Mongolia": "images-small/anvaka_Most_stereotypical_person_in_Mongolia_d8812a0f-aa4a-4d27-aff8-ca5a75b592b9.webp",
"Mali": "images-small/anvaka_Most_stereotypical_person_in_Mali_37c5c624-6d4c-4376-8a75-8465ce50e9cf.webp",
"Morocco": "images-small/anvaka_Most_stereotypical_person_in_Morocco_f141c013-6151-41eb-b563-00924d8157f5.webp",
"Latvia": "images-small/anvaka_Most_stereotypical_person_in_Latvia_85b570c4-e960-4254-acdd-2eee983b9fc2.webp",
"Lithuania": "images-small/anvaka_Most_stereotypical_person_in_Lithuania_30b6a2ff-7932-4041-bc27-2630a861d022.webp",
"Moldova": "images-small/anvaka_Most_stereotypical_person_in_Moldova_022ebda4-c1c2-45f6-8e23-ea34d0ea93b6.webp",
"Namibia": "images-small/anvaka_Most_stereotypical_person_in_Namibia_51d1a109-ffb5-4497-9674-50359416b584.webp",
"Mauritania": "images-small/anvaka_Most_stereotypical_person_in_Mauritania_2b74fa66-1525-47f5-aa19-aba0605c23e6.webp",
"Malawi": "images-small/anvaka_Most_stereotypical_person_in_Malawi_04497172-5b14-425c-bcf1-0e4bfe1973a8.webp",
"Malaysia": "images-small/anvaka_Most_stereotypical_person_in_Malaysia_25a45781-f738-43b6-8afc-18a8d3afc30e.webp",
"Mozambique": "images-small/anvaka_Most_stereotypical_person_in_Mozambique_6411b97e-30d6-4c7c-8511-81df00939194.webp",
"Niger": "images-small/anvaka_Most_stereotypical_person_in_Niger_e38b7a7c-f8bc-4725-9c0a-631470c846c7.webp",
"New Zealand": "images-small/anvaka_Most_stereotypical_person_in_New_Zealand_9158fcdf-2015-445c-99b6-909d7034cba8.webp",
"New Caledonia": "images-small/anvaka_Most_stereotypical_person_in_New_Caledonia_dde90d28-1546-4ce3-8f2e-d2c5612063f0.webp",
"Nigeria": "images-small/anvaka_Most_stereotypical_person_in_Nigeria_d90b3115-a4f7-4abf-8f0f-3b8a3816f264.webp",
"Nepal": "images-small/anvaka_Most_stereotypical_person_in_Nepal_0262ea4c-9615-459a-8556-36007dee7932.webp",
"Netherlands": "images-small/anvaka_Most_stereotypical_person_in_Netherlands_13446e40-00c2-4189-a44a-9cd4932a998e.webp",
"Norway": "images-small/anvaka_Most_stereotypical_person_in_Norway_71c21a88-86ce-47b2-830a-bc757f5b6f27.webp",
"Nicaragua": "images-small/anvaka_Most_stereotypical_person_in_Nicaragua_5cace727-6a8e-4bd2-b8d1-d32fab1f574a.webp",
"Peru": "images-small/anvaka_Most_stereotypical_person_in_Peru_eb003f81-6979-4646-b611-0f4d6f89f9a1.webp",
"Papua New Guinea": "images-small/anvaka_Most_stereotypical_person_in_Papua_New_Guinea_31783201-c9d8-4dae-b077-c4c223b4fd12.webp",
"Oman": "images-small/anvaka_Most_stereotypical_person_in_Oman_ccc6898d-c749-459d-9925-617d60647d3e.webp",
"Panama": "images-small/anvaka_Most_stereotypical_person_in_Panama_7454ddf2-6e5e-4436-a667-e8fc8d13fed5.webp",
"Philippines": "images-small/anvaka_Most_stereotypical_person_in_Philippines_7b5fde9b-91dd-4581-9962-49bb602af76a.webp",
"Portugal": "images-small/anvaka_Most_stereotypical_person_in_Portugal_3497bf7e-f8d6-4917-8e7a-ef9af3115c8e.webp",
"Puerto Rico": "images-small/anvaka_Most_stereotypical_person_in_Puerto_Rico_81d572da-1c44-43e9-b412-f1deb719da4d.webp",
"Pakistan": "images-small/anvaka_Most_stereotypical_person_in_Pakistan_199df1be-8627-4147-ac4b-f0d189dd3c34.webp",
"Poland": "images-small/anvaka_Most_stereotypical_person_in_Poland_3072959a-6ae6-4a5a-9aca-c67ff2ff6a60.webp",
"North Korea": "images-small/anvaka_Most_stereotypical_person_in_North_Korea_888ab734-abb2-4038-bc81-ed26ac98b9a5.webp",
"Western Sahara": "images-small/anvaka_Most_stereotypical_person_in_Western_Sahara_5c513ef3-8a1e-4cf2-87da-77a1ab4a8c32.webp",
"Solomon Islands": "images-small/anvaka_Most_stereotypical_person_in_Solomon_Islands_e1cbfa07-232b-4276-bc05-952648da903d.webp",
"Russia": "images-small/anvaka_Most_stereotypical_person_in_Russia_6715e13a-6ded-4eda-a866-ed134779cc52.webp",
"Saudi Arabia": "images-small/anvaka_Most_stereotypical_person_in_Saudi_Arabia_5a787a1b-4369-4ac6-9c3b-265ebe42cd3e.webp",
"Sudan": "images-small/anvaka_Most_stereotypical_person_in_Sudan_47ca009d-959c-4688-b058-91653d1b98f3.webp",
"Senegal": "images-small/anvaka_Most_stereotypical_person_in_Senegal_bb95132d-7c99-447c-800d-540426a97519.webp",
"Rwanda": "images-small/anvaka_Most_stereotypical_person_in_Rwanda_42fa4f41-20ec-4b23-8a0a-de48d963fc65.webp",
"Qatar": "images-small/anvaka_Most_stereotypical_person_in_Qatar_e3724745-1f65-427e-abcb-556750c47894.webp",
"Palestine": "images-small/anvaka_Most_stereotypical_person_in_Palestine_977e9676-0e05-4a5f-b498-0973f2452bfe.webp",
"Paraguay": "images-small/anvaka_Most_stereotypical_person_in_Paraguay_8810c86e-39d8-4c35-b791-7c897324d4fc.webp",
"Romania": "images-small/anvaka_Most_stereotypical_person_in_Romania_a07f8de8-fd68-4fd8-995b-0c1e10e905ed.webp",
"South Sudan": "images-small/anvaka_Most_stereotypical_person_in_South_Sudan_86507964-24cc-4408-bf77-e987c8312894.webp",
"Somalia": "images-small/anvaka_Most_stereotypical_person_in_Somalia_8101cb26-7292-403f-b63d-6de5532aca3b.webp",
"Suriname": "images-small/anvaka_Most_stereotypical_person_in_Suriname_2f2d38bb-98c0-4e6b-9f07-5f401deca0a0.webp",
"Somaliland": "images-small/anvaka_Most_stereotypical_person_in_Somaliland_5c6e10a4-f02b-4278-bc69-b254818708c4.webp",
"El Salvador": "images-small/anvaka_Most_stereotypical_person_in_El_Salvador_d71f9f3c-9a83-40eb-8457-966b2cdea296.webp",
"Sierra Leone": "images-small/anvaka_Most_stereotypical_person_in_Sierra_Leone_7e3d3f69-1281-4ea2-9ba6-5316a8ddd75b.webp",
"Republic of Serbia": "images-small/anvaka_Most_stereotypical_person_in_Republic_of_Serbia_31e6d705-a23f-4ac3-9828-b74bde528ee7.webp",
"Chad": "images-small/anvaka_Most_stereotypical_person_in_Chad_be730f8c-2e3f-4ad5-af10-b7845e6d3aad.webp",
"Tajikistan": "images-small/anvaka_Most_stereotypical_person_in_Tajikistan_49cdfd6e-b22f-4fe0-9a69-d5ef4c7c0905.webp",
"Syria": "images-small/anvaka_Most_stereotypical_person_in_Syria_0c870d12-2818-4474-a062-a7ae46c1a372.webp",
"Turkmenistan": "images-small/anvaka_Most_stereotypical_person_in_Turkmenistan_d464f839-1374-4381-bddc-5f702e8cdbd4.webp",
"Swaziland": "images-small/anvaka_Most_stereotypical_person_in_Swaziland_42d0c0e3-fcbb-4578-930b-7952f4e049c4.webp",
"Thailand": "images-small/anvaka_Most_stereotypical_person_in_Thailand_ea5e6c5a-eb3c-4045-a1f3-e4e1bac1872e.webp",
"Tunisia": "images-small/anvaka_Most_stereotypical_person_in_Tunisia_4508bb2e-e701-4082-9177-6de97cbb31a9.webp",
"Trinidad and Tobago": "images-small/anvaka_Most_stereotypical_person_in_Trinidad_and_Tobago_cd617799-83e5-4a4b-9bc7-965ff9bb67c0.webp",
"Slovenia": "images-small/anvaka_Most_stereotypical_person_in_Slovenia_c226a7e1-7205-4b2c-880d-bef9a24f8d4e.webp",
"East Timor": "images-small/anvaka_Most_stereotypical_person_in_East_Timor_dc2619a8-ec7d-466f-9c77-f60f7ae50f26.webp",
"Togo": "images-small/anvaka_Most_stereotypical_person_in_Togo_f3e6095a-d57f-483e-963d-6047b74ec477.webp",
"Sweden": "images-small/anvaka_Most_stereotypical_person_in_Sweden_a0bed96a-8f36-4f58-8ee5-ae02138a1255.webp",
"Slovakia": "images-small/anvaka_Most_stereotypical_person_in_Slovakia_52fc81b7-fcbd-4660-a15e-63231716851b.webp",
'Libya': 'images-small/anvaka_the_most_stereotypical_person_in_Libya_65bf396a-11a9-48e3-902e-d50daf1b53e9.webp',
'Mexico': 'images-small/anvaka_most_stereotypical_person_in_Mexico_2464780d-0655-44d2-93b3-bf5e38e8386a.webp',
'Canada': 'images-small/anvaka_most_typical_man_in_Canada_a2cc54c4-433e-48c2-933f-a9ac88b7763d.webp',
'Turkey': 'images-small/anvaka_Most_stereotypical_person_in_Turkey_862f160f-7411-406e-92f9-d97ce04c9f4d.webp',
'Taiwan': 'images-small/anvaka_Most_stereotypical_person_in_Taiwan_6b4fbbd2-095e-476a-93a5-c923b76cd5cf.webp',
'Ukraine': 'images-small/anvaka_Most_stereotypical_person_in_Ukraine_dcf6bfb5-e4c0-4fcb-bab8-229c3d105764.webp',
'Uganda': 'images-small/anvaka_Most_stereotypical_person_in_Uganda_703f53ea-4c36-43b7-ab40-b8883a1040a6.webp',
'Uruguay': 'images-small/anvaka_Most_stereotypical_person_in_Uruguay_de1a0ec5-5fb4-474b-b53a-64201b50bea7.webp',
'United States of America': 'images-small/anvaka_Most_stereotypical_person_in_United_States_of_America_2cb4ce69-9f04-402e-8707-c1ccfc6342ba.webp',
'Uzbekistan': 'images-small/anvaka_Most_stereotypical_person_in_Uzbekistan_bdcf92bf-a3bb-4e85-836c-f9f4c331053c.webp',
'Venezuela': 'images-small/anvaka_Most_stereotypical_person_in_Venezuela_b3fd47d9-92c9-4301-bd60-b889b742c024.webp',
'Vietnam': 'images-small/anvaka_Most_stereotypical_person_in_Vietnam_62db39f1-aa95-4a06-9670-8aab4b7dc712.webp',
'Vanuatu': 'images-small/anvaka_Most_stereotypical_person_in_Vanuatu_830d0208-f8ea-45f9-aaac-81bd025e5522.webp',
'Yemen': 'images-small/anvaka_Most_stereotypical_person_in_Yemen_5cac87ec-d592-434f-966e-f03f68b4a3ad.webp',
"South Africa": 'images-small/anvaka_Most_stereotypical_person_in_South_Africa_c22f0256-2538-4f2a-8dc5-f866d877b623.webp',
"Lesotho": "images-small/anvaka_Most_stereotypical_person_in_Lesotho_07a1c1b9-2aa6-4972-8926-e77ba0f61737.webp",
'Zambia': 'images-small/anvaka_Most_stereotypical_person_in_Zambia_2570a342-2289-4d73-af73-beaa88da7567.webp',
'Zimbabwe': 'images-small/anvaka_Most_stereotypical_person_in_Zimbabwe_c03a654d-f3d6-4ff7-a4ec-f63691e670fa.webp',
}

loadAll()

async function loadAll() {
  let borders = await loadBorders();
  let missing = []
  borders.features.forEach(b => {
    if (!countryBackground[b.properties.admin]) {
      missing.push(`/imagine prompt:"Most stereotypical person in ${b.properties.admin}"`);
    }
  });
  missing.forEach(x => console.log(x));
  initMap(borders);
}

function loadBorders() {
  const bounds = 'ne_110m_admin_0_countries.geojson';
  return fetch(bounds).then(res => res.json());
}

function initMap(borders) {
  map.addSource("borders", {
    "type": "geojson",
    "data": borders
  });
  // add this layer to track clicked countries
  map.addLayer({
    "id": "country-backgrounds",
    "type": "fill",
    "source": "borders",
    "layout": {},
    "paint": {
      "fill-opacity": 0.0
     },
  });

  map.addLayer({
    "id": "borders",
    "type": "line",
    "source": "borders",
    "layout": {},
    "paint": {
      "line-color": "#ffffff",
      "line-width": 1
    },
  });

  loadNextCountry(0, borders);
  map.on('click', function (e) {
    let features = map.queryRenderedFeatures(e.point, {layers: ['country-backgrounds']});
    if (!features.length) return;
    renderSideBar(features[0].properties.admin)
  });
}

function loadNextCountry(countryIndex, borders) {
  let countryPolygon = borders.features[countryIndex];
  if (!countryPolygon) return;

  const countryInfo = {
    quadrant: 0,
    countryPolygon,
    image: countryBackground[countryPolygon.properties.admin],
    loadedKeys: []
  };

  if (!countryInfo.image) return;
  loadedImages.set(countryPolygon.properties.admin, countryInfo);
  loadSingleCountry(countryInfo).then(() => loadNextCountry(countryIndex + 1, borders));
}

function loadSingleCountry(countryInfo) {
  const {countryPolygon, image, quadrant} = countryInfo;
  if (countryPolygon.geometry.type === "MultiPolygon") {
    return Promise.all(getAllPolygons(countryPolygon).map((polygon, polyIndex) => {
      return addImage(image, polygon, quadrant, polyIndex);
    }));
  } else if (countryPolygon.geometry.type === "Polygon") {
    return addImage(image, countryPolygon, quadrant, 0);
  }
}

async function addImage(imageSrc, countryPolygon, variant, polyIndex) {
  if (countryPolygon.geometry.type !== "Polygon") {
    throw new Error('Unsupported polygon type')
  }

  const img = await clipImage(imageSrc, countryPolygon.geometry.coordinates[0], variant);
  const imgKey = `image-${countryPolygon.properties.admin}-${variant}${polyIndex}`;

  map.addSource(imgKey, {
    "type": "image",
    "url": img.canvas.toDataURL(),
    "coordinates": img.coordinates
  });

  map.addLayer({
    "id": imgKey,
    "type": "raster",
    "source": imgKey,
    "paint": { "raster-opacity": 1 }
  }, 'borders');

  loadedImages.get(countryPolygon.properties.admin).loadedKeys.push(imgKey);
  return img;
}

async function clipImage(url, coordinates, variant = 0) {
  let img = await getImage(url);

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (var coord of coordinates) {
    if (coord[0] < minLon) minLon = coord[0];
    if (coord[1] < minLat) minLat = coord[1];
    if (coord[0] > maxLon) maxLon = coord[0];
    if (coord[1] > maxLat) maxLat = coord[1];
  }
  const MAX_LATITUDE = 85.0511;
  const MIN_LATITUDE = -85.0511;
  minLat = Math.max(minLat, MIN_LATITUDE);
  maxLat = Math.min(maxLat, MAX_LATITUDE);

  const topLeft = mercator(minLon, maxLat);
  const bottomRight = mercator(maxLon, minLat);

  // Create canvas and context
  const canvas = document.createElement('canvas');
  let width = canvas.width = img.width/2;
  let height = canvas.height = img.height/2;

  const ctx = canvas.getContext('2d');

  clipContextToPolygon(ctx, coordinates, (pair) => {
    let projected = mercator(pair[0], pair[1]);
    return {
      x: (projected.x - topLeft.x) / (bottomRight.x - topLeft.x) * width, 
      y: (projected.y - topLeft.y) / (bottomRight.y - topLeft.y) * height
    };
  });

  // Draw the image
  let sx = 0, sy = 0;
  if (variant === 1 || variant === 3) sx += width;
  if (variant === 2 || variant === 3) sy += height;

  
  ctx.drawImage(img.img, sx, sy, width, height, 0, 0, width, height);
  let imageCoordinates = [
    [minLon, maxLat],
    [maxLon, maxLat],
    [maxLon, minLat],
    [minLon, minLat]
  ];

  return { canvas, coordinates: imageCoordinates };
}

function clipContextToPolygon(ctx, coordinates, project) {
  ctx.beginPath();

  var first = true;
  for (var pair of coordinates) {
    const p = project(pair);

    if (first) {
      ctx.moveTo(p.x, p.y);
      first = false;
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }

  ctx.closePath();
  ctx.clip();
}

function getAllPolygons(multiPolygon) {
  return multiPolygon.geometry.coordinates.map(polygon => ({
    geometry: {
      type: "Polygon",
      coordinates: polygon
    },
    properties: multiPolygon.properties,
  }));
}

function mercator(lon, lat) {
    // Earth radius
    var R = 6378137;
    var MAX = 85.0511287798;
    var DEG = Math.PI / 180;

    var sin = Math.sin(lat * DEG);
    if (Math.abs(sin) > 1) {
        sin = Math.sign(sin);
    }

    // Mercator projection
    var y = R * Math.log((1 + sin) / (1 - sin)) / 2;
    var x = R * lon * DEG;

    return {
        x: x,
        y: y
    };
}

function renderSideBar(countryName) {
  if (!countryName) return;
  let content = `
    <h3 class='query-title'>Query sent to <a href="https://www.midjourney.com/">Midjourney</a>
    <a href='#' class='close'>[x]</a>
    </h3>
    <code>/imagine prompt:"Most stereotypical person in <b>${countryName}</b>"</code>
    <div style="width:100%; position: relative;" class="imgContainer">
      <img src="${countryBackground[countryName]}" alt="imagine most stereotypical person in ${countryName}" />
      <div class="quadrant-border"></div>
    </div>
    <a href="${countryBackground[countryName]}" target="_blank" class="result-open">Open image in new tab</a>
    <hr />
    <iframe src="https://en.m.wikipedia.org/wiki/${countryName}" width="100%" height="100%" frameborder="0"></iframe>
  `;
  let sidebar = document.querySelector('#sidebar');
  sidebar.innerHTML = content;
  sidebar.style.display = 'block';
  sidebar.scrollTop = 0;
  sidebar.querySelector('.close').addEventListener('click', (e) => {
    e.preventDefault();
    sidebar.innerHTML = '';
    sidebar.style.display = 'none';
  });

  const mainImage = sidebar.querySelector('.imgContainer');
  const quadrantBorder = sidebar.querySelector('.quadrant-border');
  // mainImage has four quadrants, we want to highlight each one as mouse enters over it
  mainImage.addEventListener('mousemove', (e) => {
    const { quadrant, width, height } = getQuadrant(e, mainImage);
    quadrantBorder.style.left = (quadrant % 2 === 0 ? 0 : width/2) + 'px';
    quadrantBorder.style.top = (quadrant < 2 ? 0 : height/2) + 'px';
    quadrantBorder.style.width = width/2 + 'px';
    quadrantBorder.style.height = height/2 + 'px';
    quadrantBorder.style.border = '2px solid #fff';
    quadrantBorder.style.position = 'absolute';
  });
  mainImage.addEventListener('mouseleave', (e) => {
    quadrantBorder.style.border = 'none';
  });
  mainImage.addEventListener('click', (e) => {
    const { quadrant } = getQuadrant(e, mainImage);
    if (quadrant < 0 || quadrant > 3) throw new Error('Invalid quadrant');

    const countryInfo = loadedImages.get(countryName);
    if (!countryInfo || countryInfo.quadrant === quadrant) return;
    countryInfo.quadrant = quadrant;
    countryInfo.loadedKeys.forEach(key => {
      // delete old sources/layers for this key:
      map.removeLayer(key);
      map.removeSource(key);
    });
    countryInfo.quadrant = quadrant;
    countryInfo.loadedKeys = [];
    loadSingleCountry(countryInfo);
    if (window.innerWidth < 600) {
      sidebar.innerHTML = '';
      sidebar.style.display = 'none';
    }
  });

  function getQuadrant(e, mainImage) {
    const clientRect = mainImage.getBoundingClientRect();
    const x = e.clientX - clientRect.left;
    const y = e.clientY - clientRect.top;
    const width = clientRect.width;
    const height = clientRect.height;
    return {quadrant: (x < width/2 ? 0 : 1) + (y < height/2 ? 0 : 2), width, height};
  }
}