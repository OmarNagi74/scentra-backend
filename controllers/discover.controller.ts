import { Request, Response } from "express";
import { discover_services } from "../services/discover.service";

const discoverService = new discover_services();

export const getDiscoverData = async (req: Request, res: Response) => {
  try {
    const result = await discoverService.getDiscoverData();

    res.status(200).json({
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      msg: err.message,
    });
  }
};

export const searchBrands = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        msg: "Search query is required",
      });
    }

    const result = await discoverService.searchBrands(query);

    res.status(200).json({
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      msg: err.message,
    });
  }
};

export const filterProducts = async (req: Request, res: Response) => {
  try {
    const { gender, family } = req.query;

    const result = await discoverService.filterProducts(
      gender as string | undefined,
      family as string | undefined
    );

    res.status(200).json({
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      msg: err.message,
    });
  }
};

export const getBrandDetails = async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId || Array.isArray(brandId)) {
      return res.status(400).json({
        msg: "Brand ID is required",
      });
    }

    const result = await discoverService.getBrandDetails(brandId);

    res.status(200).json({
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      msg: err.message,
    });
  }
};

export const getPopularHouses = async (req: Request, res: Response) => {
  try {
    const result = await discoverService.getPopularHouses();

    res.status(200).json({
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      msg: err.message,
    });
  }
};