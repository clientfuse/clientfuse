import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ICustomerSubscription,
  ISubscriptionPlan,
  ISubscriptionResponse,
  SubscriptionStatus,
} from '@clientfuse/models';
import { Subscription } from '../schemas/subscription.schema';
import { SubscriptionPlan } from '../schemas/subscription-plan.schema';
import { ISubscriptionManager } from '../interfaces/subscription-manager.interface';

@Injectable()
export class SubscriptionService implements ISubscriptionManager {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlan>,
  ) {}

  async createSubscription(data: Partial<ICustomerSubscription>): Promise<Subscription> {
    try {
      const subscription = new this.subscriptionModel(data);
      await subscription.save();
      this.logger.log(`Subscription created: ${subscription._id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw error;
    }
  }

  async getSubscriptionByUserId(userId: string): Promise<ISubscriptionResponse | null> {
    try {
      const subscription = await this.subscriptionModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .populate('planId')
        .exec();

      if (!subscription) {
        return null;
      }

      return this.transformToResponse(subscription);
    } catch (error) {
      this.logger.error(`Failed to get subscription for user: ${userId}`, error);
      throw error;
    }
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      return await this.subscriptionModel
        .findOne({ stripeSubscriptionId })
        .populate('planId')
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${stripeSubscriptionId}`, error);
      throw error;
    }
  }

  async updateSubscription(
    stripeSubscriptionId: string,
    updates: Partial<ICustomerSubscription>,
  ): Promise<Subscription> {
    try {
      const subscription = await this.subscriptionModel
        .findOneAndUpdate(
          { stripeSubscriptionId },
          { $set: updates },
          { new: true },
        )
        .populate('planId')
        .exec();

      if (!subscription) {
        throw new NotFoundException(`Subscription not found: ${stripeSubscriptionId}`);
      }

      this.logger.log(`Subscription updated: ${stripeSubscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${stripeSubscriptionId}`, error);
      throw error;
    }
  }

  async getActivePlans(): Promise<ISubscriptionPlan[]> {
    try {
      const plans = await this.planModel.find({ isActive: true }).exec();
      return plans.map(plan => {
        const planObj = plan.toObject();
        return {
          ...planObj,
          id: planObj._id.toString(),
          createdAt: (plan as any).createdAt,
          updatedAt: (plan as any).updatedAt,
        } as ISubscriptionPlan;
      });
    } catch (error) {
      this.logger.error('Failed to get active plans', error);
      throw error;
    }
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan> {
    try {
      const plan = await this.planModel.findById(planId).exec();

      if (!plan) {
        throw new NotFoundException(`Plan not found: ${planId}`);
      }

      return plan;
    } catch (error) {
      this.logger.error(`Failed to get plan: ${planId}`, error);
      throw error;
    }
  }

  /**
   * Check if user has active paid subscription
   * This is used by the @RequiresPaidSubscription() guard
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.subscriptionModel
        .findOne({
          userId: new Types.ObjectId(userId),
          status: SubscriptionStatus.ACTIVE,
        })
        .exec();

      return !!subscription;
    } catch (error) {
      this.logger.error(`Failed to check subscription for user: ${userId}`, error);
      return false;
    }
  }

  private transformToResponse(subscription: any): ISubscriptionResponse {
    return {
      id: subscription._id.toString(),
      userId: subscription.userId.toString(),
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      planId: subscription.planId._id.toString(),
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      plan: subscription.planId,
    };
  }
}
