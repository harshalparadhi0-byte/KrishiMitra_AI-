# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
from mcp.server.fastmcp import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("krishimitra-mcp")

# Initialize FastMCP Server
mcp = FastMCP("KrishiMitra Agricultural MCP Server")

# Mock Databases
WEATHER_DB = {
    "pune": {
        "temperature": "28°C",
        "precipitation": "Heavy rainfall expected tomorrow (35mm)",
        "humidity": "82%",
        "alerts": "High humidity alert: Pest risk for fungal diseases is elevated.",
    },
    "nagpur": {
        "temperature": "38°C",
        "precipitation": "No rain, dry spell continuing",
        "humidity": "30%",
        "alerts": "Heatwave warning: Increase irrigation frequency for cotton crops.",
    },
    "nashik": {
        "temperature": "26°C",
        "precipitation": "Light drizzle (2mm)",
        "humidity": "75%",
        "alerts": "None",
    },
}

SOIL_DB = {
    "pune": {
        "NPK": "N: 45, P: 22, K: 35 (mg/kg)",
        "pH": 6.8,
        "texture": "Clay loam",
        "moisture": "Moderate (42%)",
    },
    "nagpur": {
        "NPK": "N: 35, P: 18, K: 50 (mg/kg)",
        "pH": 7.5,
        "texture": "Black cotton soil",
        "moisture": "Low (20%)",
    },
    "nashik": {
        "NPK": "N: 50, P: 25, K: 40 (mg/kg)",
        "pH": 6.2,
        "texture": "Sandy loam",
        "moisture": "Moderate (38%)",
    },
}

MARKET_DB = {
    "tomato": {
        "price_per_quintal": "INR 2,200",
        "trend": "Bearish (due to high arrivals from Karnataka)",
        "volume": "1,500 tons",
        "best_market": "APMC Pune",
    },
    "rice": {
        "price_per_quintal": "INR 3,100",
        "trend": "Bullish (strong export demand)",
        "volume": "5,000 tons",
        "best_market": "APMC Nagpur",
    },
    "wheat": {
        "price_per_quintal": "INR 2,400",
        "trend": "Stable",
        "volume": "3,200 tons",
        "best_market": "APMC Nashik",
    },
    "cotton": {
        "price_per_quintal": "INR 7,200",
        "trend": "Bullish (global cotton shortage)",
        "volume": "2,200 tons",
        "best_market": "APMC Nagpur",
    },
    "onion": {
        "price_per_quintal": "INR 1,800",
        "trend": "Bearish (export restrictions)",
        "volume": "4,500 tons",
        "best_market": "APMC Nashik",
    },
}

CROP_DB = {
    "tomato": {
        "optimal_conditions": "Soil pH: 6.0-7.0, Temp: 20-30°C, moderate moisture.",
        "pests_and_diseases": "Leaf spot (fungal), Fruit borer, Early blight.",
        "growth_cycle": "90-120 days",
        "standard_fertilizer": "NPK 5-10-10 at planting, follow-up with nitrogen-rich top dressing.",
    },
    "rice": {
        "optimal_conditions": "Soil pH: 5.5-6.5, Temp: 22-32°C, standing water / high moisture.",
        "pests_and_diseases": "Blast disease, Stem borer, Leaf folder.",
        "growth_cycle": "120-150 days",
        "standard_fertilizer": "NPK 120:60:60 kg/ha split applications.",
    },
    "wheat": {
        "optimal_conditions": "Soil pH: 6.0-7.5, Temp: 15-25°C, cool growing period with warm ripening.",
        "pests_and_diseases": "Rust (brown/black), Loose smut, Aphids.",
        "growth_cycle": "110-140 days",
        "standard_fertilizer": "NPK 120:60:40 kg/ha, split nitrogen after irrigation.",
    },
    "cotton": {
        "optimal_conditions": "Soil pH: 6.0-8.0, Temp: 21-35°C, low to moderate rainfall, deep soils.",
        "pests_and_diseases": "Bollworm, Jassids, Aphids, Fusarium wilt.",
        "growth_cycle": "150-180 days",
        "standard_fertilizer": "NPK 100:50:50 kg/ha with zinc micro-nutrients.",
    },
    "onion": {
        "optimal_conditions": "Soil pH: 5.8-6.5, Temp: 15-25°C, mild weather without extreme frost or heat.",
        "pests_and_diseases": "Thrips, Purple blotch, Downy mildew.",
        "growth_cycle": "110-130 days",
        "standard_fertilizer": "NPK 100:50:80 kg/ha plus sulfur dressing.",
    },
}


@mcp.tool()
def get_weather_forecast(location: str) -> str:
    """Gets the weather forecast for a location.

    Args:
        location: The name of the city or district (e.g., Pune, Nagpur, Nashik).

    Returns:
        A detailed string with temperature, precipitation, humidity, and alerts.
    """
    loc_key = location.strip().lower()
    logger.info(f"MCP: get_weather_forecast called for location: {location}")
    if loc_key in WEATHER_DB:
        data = WEATHER_DB[loc_key]
        return (
            f"Weather Forecast for {location.title()}:\n"
            f"- Temperature: {data['temperature']}\n"
            f"- Precipitation: {data['precipitation']}\n"
            f"- Humidity: {data['humidity']}\n"
            f"- Alerts: {data['alerts']}"
        )
    return (
        f"Weather Forecast for {location.title()}:\n"
        f"- Temperature: 27°C\n"
        f"- Precipitation: Light showers possible (5mm)\n"
        f"- Humidity: 65%\n"
        f"- Alerts: None"
    )


@mcp.tool()
def get_soil_data(location: str) -> str:
    """Gets soil properties (NPK, pH, texture, moisture) for a location.

    Args:
        location: The name of the city or district (e.g., Pune, Nagpur, Nashik).

    Returns:
        A detailed string with NPK levels, pH, texture, and moisture.
    """
    loc_key = location.strip().lower()
    logger.info(f"MCP: get_soil_data called for location: {location}")
    if loc_key in SOIL_DB:
        data = SOIL_DB[loc_key]
        return (
            f"Soil Data for {location.title()}:\n"
            f"- NPK Levels: {data['NPK']}\n"
            f"- Soil pH: {data['pH']}\n"
            f"- Texture: {data['texture']}\n"
            f"- Moisture: {data['moisture']}"
        )
    return (
        f"Soil Data for {location.title()}:\n"
        f"- NPK Levels: N: 40, P: 20, K: 40 (mg/kg)\n"
        f"- Soil pH: 6.5\n"
        f"- Texture: Loam\n"
        f"- Moisture: Moderate (35%)"
    )


@mcp.tool()
def get_market_price(crop: str) -> str:
    """Gets the current market price and market trends for a crop.

    Args:
        crop: The name of the crop (e.g., Tomato, Rice, Wheat, Cotton, Onion).

    Returns:
        A detailed string with price per quintal, price trends, volume, and best market.
    """
    crop_key = crop.strip().lower()
    logger.info(f"MCP: get_market_price called for crop: {crop}")
    if crop_key in MARKET_DB:
        data = MARKET_DB[crop_key]
        return (
            f"Market Intelligence for {crop.title()}:\n"
            f"- Price per Quintal: {data['price_per_quintal']}\n"
            f"- Trend: {data['trend']}\n"
            f"- Volume: {data['volume']}\n"
            f"- Recommended APMC Market: {data['best_market']}"
        )
    return (
        f"Market Intelligence for {crop.title()}:\n"
        f"- Price per Quintal: INR 2,000 (Estimate)\n"
        f"- Trend: Stable\n"
        f"- Volume: Moderate\n"
        f"- Recommended APMC Market: Local APMC Market"
    )


@mcp.tool()
def search_crop_database(crop: str) -> str:
    """Searches the agricultural crop database for growth parameters, fertilizer needs, and common diseases.

    Args:
        crop: The name of the crop (e.g., Tomato, Rice, Wheat, Cotton, Onion).

    Returns:
        A detailed string with optimal conditions, common pests/diseases, growth cycle, and standard fertilizers.
    """
    crop_key = crop.strip().lower()
    logger.info(f"MCP: search_crop_database called for crop: {crop}")
    if crop_key in CROP_DB:
        data = CROP_DB[crop_key]
        return (
            f"Crop Database info for {crop.title()}:\n"
            f"- Optimal Conditions: {data['optimal_conditions']}\n"
            f"- Common Pests & Diseases: {data['pests_and_diseases']}\n"
            f"- Growth Cycle: {data['growth_cycle']}\n"
            f"- Standard Fertilizer: {data['standard_fertilizer']}"
        )
    return (
        f"Crop Database info for {crop.title()}:\n"
        f"- Optimal Conditions: Soil pH 6.0-7.0, moderate temperature and rainfall.\n"
        f"- Common Pests & Diseases: Aphids, root rot.\n"
        f"- Growth Cycle: 100-130 days\n"
        f"- Standard Fertilizer: Standard NPK fertilizer based on soil testing."
    )


if __name__ == "__main__":
    mcp.run()
