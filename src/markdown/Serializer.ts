/* eslint-disable no-param-reassign */
import { workspace } from "vscode";

import { Card } from "../models/Card";
import { CardParser } from "./parsers/cardParser";
import { getLogger } from "../logger";
import { Media } from "../models/Media";
import path from "path";
import fs from "fs";
import { getQABlocks } from "../utils";

interface ParsedData {
  /** DeckName can be null in which case we use the defaultDeck */
  deckName: string | null;
  cards: Card[];
  media: Media[];
}

export class Serializer {
  private source: string;
  private useDefault: boolean;

  public constructor(source: string, useDefault: boolean) {
    this.source = source;
    this.useDefault = useDefault;
  }

  public async transform(): Promise<ParsedData> {
    const markdownSource = this.source;
    return await this.splitByCards(markdownSource);
  }

  private getConfig(conf: string) {
    return workspace.getConfiguration("anki.md").get(conf);
  }

  private async splitByCards(mdString: string): Promise<ParsedData> {
    const titleMatch = mdString.match(/#\s+([^\n]+)/)
    const deckName = titleMatch ? titleMatch[1] : ''

    // If we call "send to own deck" we need the title, if we don't have it error out here
    if (!deckName && this.useDefault === false) {
      getLogger().error(
        "Serializer: Could not find H1 title in this document!"
      );
      throw new Error("Unable to parse title!");
    }

    const parsedCards = await getQABlocks(mdString)
    const cards = parsedCards
      // card should have at least a front side
      // Cloze cards don't need an answer side
      .filter((card) => card?.question);

    // get media from markdown file
    const media = this.mediaFromCards(cards);

    return {
      deckName,
      cards,
      media,
    };
  }

  /**
   * Search media in cards and add it to the media collection
   */
  private mediaFromCards(cards: Card[]) {
    const mediaList: Media[] = [];

    cards.forEach((card) => {
      card.setQuestion(this.prepareMediaForSide(card.question, mediaList));
      card.setAnswer(this.prepareMediaForSide(card.answer, mediaList));
    });

    return mediaList;
  }

  /**
   * Prepare media from card's and prepare it for using
   * @param {string} side
   * @param {[Media]} mediaList
   * @private
   */
  prepareMediaForSide(side: string, mediaList: Media[]) {
    const pattern = /src="([^"]*?)"/g;

    const prepare = (_: string, p1: string) => {
      const filePath = path.resolve(
        workspace.workspaceFolders?.[0].uri.fsPath ?? "",
        p1
      );

      const fileExt = path.extname(filePath);

      const data = fs.readFileSync(filePath, {
        encoding: "base64",
      });
      const media = new Media(data);

      media.fileName = `${media.checksum}${fileExt}`;

      const hasMedia = mediaList.some(
        (item) => item.checksum === media.checksum
      );
      if (!hasMedia) {
        mediaList.push(media);
      }

      return `src="${media.fileName}"`;
    };

    return side.replace(pattern, prepare);
  }
}
