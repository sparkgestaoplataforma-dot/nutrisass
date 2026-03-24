import { Response, Request } from "express";

export async function buscarPorId(req: Request<{id: string}>, res: Response) {
    const id = req.params.id;

}
